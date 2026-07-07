/**
 * Probabilistic Forecast Engine — derived from real connected signals only.
 * No fabrication. Missing data → confidence = 0, explicit warning.
 */
import type { InstitutionalVerdictV2 } from "./institutional-score-v2";
import type { CVDStats } from "../hooks/useCVD";
import type { OFIStats } from "../hooks/useOFI";
import type { SMCAnalysis } from "./smc";

export interface ForecastOutput {
  continuationPct: number;
  reversalPct: number;
  breakoutWatch: boolean;
  meanReversionWatch: boolean;
  trapRisk: number;
  invalidationLevel: number;
  bestContext: string;
  avoidConditions: string[];
  confidence: number;
  regime: "trending" | "ranging" | "volatile" | "unknown";
  drivers: string[];
  contradictions: string[];
  dataWarning?: string;
}

export function computeForecast(
  verdict: InstitutionalVerdictV2 | null,
  cvd: CVDStats | null,
  ofi: OFIStats | null,
  smc: SMCAnalysis | null,
): ForecastOutput {
  if (!verdict) {
    return {
      continuationPct: 50, reversalPct: 50,
      breakoutWatch: false, meanReversionWatch: false,
      trapRisk: 50, invalidationLevel: 0,
      bestContext: "لا تتوفر بيانات كافية للتنبؤ",
      avoidConditions: ["تجنب الدخول حتى تستقر البيانات"],
      confidence: 0, regime: "unknown",
      drivers: [], contradictions: [],
      dataWarning: "البيانات غير مكتملة",
    };
  }

  const regime   = verdict.compositeScore.regime;
  const chop     = verdict.compositeScore.chopLevel;
  const spreadH  = verdict.compositeScore.spreadHealth;
  const score    = verdict.score;
  const conf     = verdict.confidence;
  const rsi      = verdict.components.rsiPenalty;
  const wallP    = verdict.components.wallPressure;
  const bookImb  = verdict.components.bookImbalance;
  const fundingBias = verdict.components.fundingBias ?? 0;
  const oiTrend   = verdict.components.oiTrend ?? 0;
  const hasFutures = Math.abs(fundingBias) > 0.001 || Math.abs(oiTrend) > 0.001;

  const drivers: string[]       = [];
  const contradictions: string[] = [];

  // ── Base continuation probability from score magnitude ─────────────────
  const scoreMag = Math.abs(score) / 100;
  let contBase = 50 + scoreMag * 30;    // 50..80

  // ── Regime adjustment ─────────────────────────────────────────────────
  if (regime === "trending") {
    contBase += 8;
    drivers.push("سوق في اتجاه واضح — يدعم الاستمرارية");
  } else if (regime === "volatile") {
    contBase -= 10;
    contradictions.push("تذبذب عالٍ — موثوقية الاتجاه منخفضة");
  } else {
    contBase -= 5;
    drivers.push("سوق متذبذب — فرص الانعكاس أعلى");
  }

  // ── CVD ───────────────────────────────────────────────────────────────
  if (cvd?.divergence) {
    const cvdBear = cvd.divergenceType === "hidden_selling";
    if (score > 0 && cvdBear) {
      contBase -= 15;
      contradictions.push("CVD: ضغط بيع مؤسساتي مخفي رغم ارتفاع السعر");
    } else if (score < 0 && !cvdBear) {
      contBase -= 15;
      contradictions.push("CVD: شراء مؤسساتي مخفي رغم انخفاض السعر");
    }
  } else if (cvd?.trend === "bullish" && score > 0) {
    contBase += 5; drivers.push("CVD يؤكد الزخم الشرائي");
  } else if (cvd?.trend === "bearish" && score < 0) {
    contBase += 5; drivers.push("CVD يؤكد الزخم البيعي");
  }

  // ── OFI ───────────────────────────────────────────────────────────────
  if (ofi) {
    if (ofi.pressure === "buy" && score > 0) {
      contBase += 6; drivers.push("تدفق الأوامر يدعم الشراء");
    } else if (ofi.pressure === "sell" && score < 0) {
      contBase += 6; drivers.push("تدفق الأوامر يدعم البيع");
    } else if (ofi.pressure !== "neutral") {
      contBase -= 4; contradictions.push("تدفق الأوامر يتعارض مع الانحياز");
    }
  }

  // ── SMC ───────────────────────────────────────────────────────────────
  if (smc) {
    if (smc.trend === "up" && score > 0) {
      contBase += 7; drivers.push("هيكل SMC صاعد — BOS محمي");
    } else if (smc.trend === "down" && score < 0) {
      contBase += 7; drivers.push("هيكل SMC هابط — CHOCH مؤكد");
    } else if (smc.trend !== "ranging") {
      contBase -= 8; contradictions.push("بنية SMC تتعارض مع الانحياز الحالي");
    }
  }

  // ── Futures signal adjustment ─────────────────────────────────────────
  if (hasFutures) {
    // Funding rate as contrarian signal: crowded longs → bearish warning
    const fundingScore = fundingBias;
    if (Math.sign(fundingScore) === Math.sign(score)) {
      contBase += 4;
      drivers.push(`معدل التمويل يتوافق — رأسمال جديد ${fundingBias > 0 ? "يدخل" : "يخرج"}`);
    } else {
      contBase -= 8;
      contradictions.push(`معدل التمويل يتناقض مع الانحياز — تحذير مراكز مزدحمة`);
    }
    // OI trend as momentum confirmation
    if (Math.sign(oiTrend) === Math.sign(score)) {
      contBase += 3;
      drivers.push(`OI يتزايد مع الاتجاه — رأسمال جديد يتدفق`);
    } else if (Math.abs(oiTrend) > 0.2) {
      contradictions.push(`OI يتناقص رغم اتجاه السعر — قد تكون عكس الماركت`);
    }
  }

  // ── Noise dampening ───────────────────────────────────────────────────
  contBase -= chop * 12;
  if (chop > 0.6) contradictions.push("مستوى التشتت مرتفع");
  if (spreadH < 0.5) { contBase -= 8; contradictions.push("فارق سعري واسع — دقة دفتر الأوامر منخفضة"); }

  const cont = Math.round(Math.max(25, Math.min(82, contBase)));

  // ── Secondary signals ─────────────────────────────────────────────────
  const breakoutWatch = regime === "trending" && Math.abs(wallP) > 0.3 &&
    Math.sign(wallP) === Math.sign(score) && chop < 0.35;
  const meanReversionWatch = regime === "ranging" && rsi < -0.15 && Math.abs(score) > 30;

  if (breakoutWatch) drivers.push("الجدران والزخم متوافقة — مراقبة اختراق");
  if (meanReversionWatch) drivers.push("RSI متطرف + سوق متذبذب — احتمال انعكاس");

  // ── Trap risk ─────────────────────────────────────────────────────────
  let trap = 30;
  if (cvd?.divergence) trap += 25;
  if (regime === "volatile") trap += 15;
  if (chop > 0.5) trap += 10;
  if (Math.abs(bookImb) > 0.6) trap += 10;
  const trapRisk = Math.min(85, trap);

  // ── Invalidation from ATR stop ────────────────────────────────────────
  const invalidationLevel = verdict.targets?.stop ?? 0;

  // ── Forecast confidence ───────────────────────────────────────────────
  const dataScore = (cvd ? 25 : 0) + (ofi ? 25 : 0) + (smc ? 25 : 0) + (hasFutures ? 25 : 0);
  const forecastConf = Math.max(0, Math.min(100,
    Math.round(conf * 0.5 + dataScore * 0.3 - chop * 20)
  ));

  // ── Best context ──────────────────────────────────────────────────────
  let bestContext: string;
  if (conf < 35 || chop > 0.6) {
    bestContext = "انتظر إشارة أوضح — الظروف الحالية غير مناسبة للدخول";
  } else if (breakoutWatch && cont >= 70) {
    bestContext = "فرصة اختراق — ادخل مع تأكيد كسر الجدار وتوافق الحجم";
  } else if (meanReversionWatch) {
    bestContext = "انعكاس محتمل — انتظر تأكيد التعافي قبل الدخول";
  } else if (score > 40 && conf > 55) {
    bestContext = "تحيز شرائي مدعوم — فرصة دخول بوقف خسارة ATR";
  } else if (score < -40 && conf > 55) {
    bestContext = "تحيز بيعي مدعوم — فرصة بيع بوقف خسارة ATR";
  } else {
    bestContext = "إشارة متوسطة — حجم محافظ وإدارة مخاطر صارمة";
  }

  // ── Avoid conditions ──────────────────────────────────────────────────
  const avoidConditions: string[] = [];
  if (chop > 0.55) avoidConditions.push("تجنب الدخول في سوق عالي التشتت");
  if (trapRisk > 60) avoidConditions.push("خطر فخ سيولة — ابتعد عن القمم/القيعان المتساوية");
  if (spreadH < 0.4) avoidConditions.push("فارق واسع — تجنب الأوامر السوقية");
  if (cvd?.divergence) avoidConditions.push("تباين CVD نشط — لا تطارد الاتجاه الظاهري");
  if (regime === "volatile") avoidConditions.push("تجنب الرافعة العالية في التقلب الشديد");
  if (avoidConditions.length === 0) avoidConditions.push("لا تحذيرات حرجة حاليًا");

  const regimeOut: ForecastOutput["regime"] =
    regime === "trending" ? "trending" :
    regime === "volatile" ? "volatile" :
    regime === "ranging"  ? "ranging"  : "unknown";

  return {
    continuationPct: cont, reversalPct: 100 - cont,
    breakoutWatch, meanReversionWatch, trapRisk,
    invalidationLevel, bestContext, avoidConditions,
    confidence: forecastConf, regime: regimeOut,
    drivers, contradictions,
  };
}
