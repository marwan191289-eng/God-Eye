import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODEL_DIR = path.resolve(__dirname, "../model");

let model: any = null;

async function loadModel() {
  try {
    const tfModule = await import("@tensorflow/tfjs").catch(() => null);
    if (!tfModule) {
      console.warn("[rl] @tensorflow/tfjs not found, using fallback policy");
      return;
    }
    const tf = tfModule;
    model = await tf.loadLayersModel(`file://${MODEL_DIR}/model.json`);
    console.log("[rl] TF model loaded");
  } catch (err: any) {
    console.warn("[rl] Model load failed, using fallback policy:", err.message);
  }
}

loadModel();

function fallbackPolicy(): number {
  return Math.floor(Math.random() * 3);
}

router.post("/action", async (req, res) => {
  const state: unknown = req.body?.state;
  if (!Array.isArray(state)) {
    res.status(400).json({ error: "state must be an array" });
    return;
  }

  if (!model) {
    res.json({ action: fallbackPolicy() });
    return;
  }

  try {
    const tf = await import("@tensorflow/tfjs");
    const input = tf.tensor([state as number[]]);
    const output = model.predict(input) as any;
    const action = output.argMax(-1).dataSync()[0] as number;
    res.json({ action });
  } catch {
    res.json({ action: fallbackPolicy() });
  }
});

export default router;
