import crypto from 'crypto';

interface UITheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

interface UIComponent {
  id: string;
  name: string;
  type: 'button' | 'input' | 'card' | 'modal' | 'chart' | 'table' | 'form' | 'navigation';
  props: { [key: string]: any };
  children?: UIComponent[];
}

interface DashboardLayout {
  id: string;
  userId: string;
  name: string;
  widgets: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    config: { [key: string]: any };
  }>;
  isDefault: boolean;
  createdAt: number;
}

interface ResponsiveBreakpoint {
  name: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  minWidth: number;
  maxWidth: number;
}

interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra_large';
  reduceMotion: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigationEnabled: boolean;
}

/**
 * UI Service
 * Handles UI components, themes, layouts, and design system
 */
export class UIService {
  private static readonly DEFAULT_THEME: UITheme = {
    id: crypto.randomUUID(),
    name: 'Default Dark',
    primary: '#1E88E5',
    secondary: '#43A047',
    accent: '#FB8C00',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    success: '#43A047',
    warning: '#FB8C00',
    error: '#E53935',
    info: '#1E88E5',
  };

  private static readonly RESPONSIVE_BREAKPOINTS: ResponsiveBreakpoint[] = [
    { name: 'xs', minWidth: 0, maxWidth: 480 },
    { name: 'sm', minWidth: 481, maxWidth: 768 },
    { name: 'md', minWidth: 769, maxWidth: 1024 },
    { name: 'lg', minWidth: 1025, maxWidth: 1440 },
    { name: 'xl', minWidth: 1441, maxWidth: 1920 },
    { name: '2xl', minWidth: 1921, maxWidth: 2560 },
  ];

  /**
   * Get Default Theme
   */
  static getDefaultTheme(): UITheme {
    return { ...this.DEFAULT_THEME };
  }

  /**
   * Create Custom Theme
   */
  static createCustomTheme(
    name: string,
    colors: Partial<UITheme>
  ): UITheme {
    return {
      ...this.DEFAULT_THEME,
      id: crypto.randomUUID(),
      name,
      ...colors,
    };
  }

  /**
   * Get Responsive Breakpoints
   */
  static getResponsiveBreakpoints(): ResponsiveBreakpoint[] {
    return this.RESPONSIVE_BREAKPOINTS;
  }

  /**
   * Get Breakpoint by Width
   */
  static getBreakpointByWidth(width: number): ResponsiveBreakpoint | undefined {
    return this.RESPONSIVE_BREAKPOINTS.find(
      (bp) => width >= bp.minWidth && width <= bp.maxWidth
    );
  }

  /**
   * Create Dashboard Layout
   */
  static createDashboardLayout(
    userId: string,
    name: string,
    widgets: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
      config: { [key: string]: any };
    }> = []
  ): DashboardLayout {
    return {
      id: crypto.randomUUID(),
      userId,
      name,
      widgets,
      isDefault: false,
      createdAt: Date.now(),
    };
  }

  /**
   * Add Widget to Layout
   */
  static addWidgetToLayout(
    layout: DashboardLayout,
    widget: {
      id: string;
      type: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
      config: { [key: string]: any };
    }
  ): DashboardLayout {
    layout.widgets.push(widget);
    return layout;
  }

  /**
   * Remove Widget from Layout
   */
  static removeWidgetFromLayout(
    layout: DashboardLayout,
    widgetId: string
  ): DashboardLayout {
    layout.widgets = layout.widgets.filter((w) => w.id !== widgetId);
    return layout;
  }

  /**
   * Update Widget Config
   */
  static updateWidgetConfig(
    layout: DashboardLayout,
    widgetId: string,
    config: { [key: string]: any }
  ): DashboardLayout {
    const widget = layout.widgets.find((w) => w.id === widgetId);
    if (widget) {
      widget.config = { ...widget.config, ...config };
    }
    return layout;
  }

  /**
   * Get Default Dashboard Layouts
   */
  static getDefaultDashboardLayouts(): DashboardLayout[] {
    return [
      this.createDashboardLayout('system', 'Trading Dashboard', [
        {
          id: crypto.randomUUID(),
          type: 'price_chart',
          position: { x: 0, y: 0 },
          size: { width: 8, height: 6 },
          config: { symbol: 'BTCUSDT', timeframe: '1h' },
        },
        {
          id: crypto.randomUUID(),
          type: 'order_book',
          position: { x: 8, y: 0 },
          size: { width: 4, height: 6 },
          config: { symbol: 'BTCUSDT' },
        },
        {
          id: crypto.randomUUID(),
          type: 'recent_trades',
          position: { x: 0, y: 6 },
          size: { width: 6, height: 4 },
          config: { symbol: 'BTCUSDT' },
        },
        {
          id: crypto.randomUUID(),
          type: 'portfolio',
          position: { x: 6, y: 6 },
          size: { width: 6, height: 4 },
          config: {},
        },
      ]),
      this.createDashboardLayout('system', 'Analytics Dashboard', [
        {
          id: crypto.randomUUID(),
          type: 'market_overview',
          position: { x: 0, y: 0 },
          size: { width: 12, height: 3 },
          config: {},
        },
        {
          id: crypto.randomUUID(),
          type: 'heatmap',
          position: { x: 0, y: 3 },
          size: { width: 6, height: 5 },
          config: {},
        },
        {
          id: crypto.randomUUID(),
          type: 'signals',
          position: { x: 6, y: 3 },
          size: { width: 6, height: 5 },
          config: {},
        },
      ]),
    ];
  }

  /**
   * Create UI Component
   */
  static createUIComponent(
    name: string,
    type: 'button' | 'input' | 'card' | 'modal' | 'chart' | 'table' | 'form' | 'navigation',
    props: { [key: string]: any } = {}
  ): UIComponent {
    return {
      id: crypto.randomUUID(),
      name,
      type,
      props,
      children: [],
    };
  }

  /**
   * Add Child Component
   */
  static addChildComponent(
    parent: UIComponent,
    child: UIComponent
  ): UIComponent {
    if (!parent.children) {
      parent.children = [];
    }
    parent.children.push(child);
    return parent;
  }

  /**
   * Generate Component Props
   */
  static generateComponentProps(
    componentType: string,
    customProps: { [key: string]: any } = {}
  ): { [key: string]: any } {
    const defaultProps: { [key: string]: { [key: string]: any } } = {
      button: {
        variant: 'primary',
        size: 'medium',
        disabled: false,
        loading: false,
      },
      input: {
        type: 'text',
        placeholder: '',
        required: false,
        disabled: false,
      },
      card: {
        elevation: 1,
        padding: 'medium',
        rounded: true,
      },
      modal: {
        size: 'medium',
        dismissible: true,
        backdrop: true,
      },
      chart: {
        type: 'line',
        responsive: true,
        legend: true,
      },
      table: {
        striped: true,
        hoverable: true,
        paginated: true,
        pageSize: 10,
      },
      form: {
        layout: 'vertical',
        submitText: 'Submit',
        resetText: 'Reset',
      },
      navigation: {
        variant: 'horizontal',
        sticky: true,
        responsive: true,
      },
    };

    return {
      ...defaultProps[componentType],
      ...customProps,
    };
  }

  /**
   * Create Accessibility Settings
   */
  static createAccessibilitySettings(
    overrides: Partial<AccessibilitySettings> = {}
  ): AccessibilitySettings {
    const defaults: AccessibilitySettings = {
      highContrast: false,
      fontSize: 'medium',
      reduceMotion: false,
      screenReaderOptimized: true,
      keyboardNavigationEnabled: true,
    };

    return { ...defaults, ...overrides };
  }

  /**
   * Apply Accessibility Settings
   */
  static applyAccessibilitySettings(
    theme: UITheme,
    settings: AccessibilitySettings
  ): UITheme {
    if (settings.highContrast) {
      theme.text = '#000000';
      theme.background = '#FFFFFF';
      theme.primary = '#0000FF';
    }

    return theme;
  }

  /**
   * Get Font Sizes
   */
  static getFontSizes(fontSize: 'small' | 'medium' | 'large' | 'extra_large'): {
    [key: string]: number;
  } {
    const fontSizes: { [key: string]: { [key: string]: number } } = {
      small: { xs: 10, sm: 12, md: 14, lg: 16, xl: 18 },
      medium: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 },
      large: { xs: 14, sm: 16, md: 18, lg: 20, xl: 22 },
      extra_large: { xs: 16, sm: 18, md: 20, lg: 22, xl: 24 },
    };

    return fontSizes[fontSize] || fontSizes.medium;
  }

  /**
   * Get Spacing Scale
   */
  static getSpacingScale(): { [key: string]: number } {
    return {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      '2xl': 48,
    };
  }

  /**
   * Generate CSS Variables
   */
  static generateCSSVariables(theme: UITheme): string {
    let css = ':root {\n';

    for (const [key, value] of Object.entries(theme)) {
      if (typeof value === 'string' && value.startsWith('#')) {
        css += `  --color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};\n`;
      }
    }

    css += '}\n';

    return css;
  }

  /**
   * Get Icon Library
   */
  static getIconLibrary(): { [key: string]: string } {
    return {
      home: 'home',
      dashboard: 'dashboard',
      trading: 'trending_up',
      portfolio: 'account_balance',
      settings: 'settings',
      notifications: 'notifications',
      profile: 'account_circle',
      logout: 'logout',
      menu: 'menu',
      close: 'close',
      search: 'search',
      filter: 'filter_list',
      download: 'download',
      upload: 'upload',
      delete: 'delete',
      edit: 'edit',
      add: 'add',
      refresh: 'refresh',
    };
  }

  /**
   * Generate Responsive CSS
   */
  static generateResponsiveCSS(
    baseStyles: string,
    responsiveStyles: { [key: string]: string }
  ): string {
    let css = baseStyles + '\n';

    for (const [breakpoint, styles] of Object.entries(responsiveStyles)) {
      const bp = this.RESPONSIVE_BREAKPOINTS.find((b) => b.name === breakpoint);
      if (bp) {
        css += `@media (min-width: ${bp.minWidth}px) {\n  ${styles}\n}\n`;
      }
    }

    return css;
  }

  /**
   * Get Animation Presets
   */
  static getAnimationPresets(): { [key: string]: string } {
    return {
      fadeIn: 'fade-in 0.3s ease-in',
      slideIn: 'slide-in 0.3s ease-out',
      slideUp: 'slide-up 0.3s ease-out',
      bounce: 'bounce 0.5s ease-in-out',
      pulse: 'pulse 2s ease-in-out infinite',
      spin: 'spin 1s linear infinite',
    };
  }

  /**
   * Export Design System
   */
  static exportDesignSystem(theme: UITheme): any {
    return {
      theme,
      breakpoints: this.RESPONSIVE_BREAKPOINTS,
      spacing: this.getSpacingScale(),
      typography: {
        fontSizes: this.getFontSizes('medium'),
        fontFamily: 'Inter, sans-serif',
        lineHeight: 1.5,
      },
      colors: {
        primary: theme.primary,
        secondary: theme.secondary,
        accent: theme.accent,
        success: theme.success,
        warning: theme.warning,
        error: theme.error,
        info: theme.info,
      },
      animations: this.getAnimationPresets(),
      icons: this.getIconLibrary(),
    };
  }
}

export default UIService;
