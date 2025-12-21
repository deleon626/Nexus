import 'package:flutter/material.dart';

/// Design System Tokens for Nexus QC Application
/// Based on oklch color space for perceptual uniformity
class DesignTokens {
  // Private constructor to prevent instantiation
  DesignTokens._();

  // ============================================================================
  // COLOR SYSTEM - Light Theme
  // ============================================================================

  /// Background color (oklch(0.9821 0 0))
  static const Color background = Color(0xFAFAFA);

  /// Primary text/foreground color (oklch(0.2435 0 0))
  static const Color foreground = Color(0xFF3E3E3E);

  /// Card/surface color (oklch(0.9911 0 0))
  static const Color card = Color(0xFFFFFFFF);

  /// Card foreground text color
  static const Color cardForeground = Color(0xFF3E3E3E);

  /// Popover/modal background
  static const Color popover = Color(0xFFFFFFFF);

  /// Popover foreground text
  static const Color popoverForeground = Color(0xFF3E3E3E);

  /// Primary brand color (oklch(0.4341 0.0392 41.9938)) - Blue
  static const Color primary = Color(0xFF3B82F6);

  /// Primary foreground (white text on primary)
  static const Color primaryForeground = Color(0xFFFFFFFF);

  /// Muted background (oklch(0.9521 0 0))
  static const Color muted = Color(0xFFF3F3F3);

  /// Muted foreground text (oklch(0.5032 0 0))
  static const Color mutedForeground = Color(0xFF808080);

  /// Accent color (oklch(0.9310 0 0))
  static const Color accent = Color(0xFFEDEDED);

  /// Accent foreground
  static const Color accentForeground = Color(0xFF3E3E3E);

  /// Destructive/error color (oklch(0.6271 0.1936 33.3390)) - Red
  static const Color destructive = Color(0xFFEF4444);

  /// Destructive foreground
  static const Color destructiveForeground = Color(0xFFFFFFFF);

  /// Border color (oklch(0.8822 0 0))
  static const Color border = Color(0xFFE1E1E1);

  /// Input field background (oklch(0.8822 0 0))
  static const Color input = Color(0xFFE1E1E1);

  /// Focus ring color
  static const Color ring = Color(0xFF3B82F6);

  // ============================================================================
  // SUCCESS COLOR (derived)
  // ============================================================================

  /// Success color for confirmations and positive states
  static const Color success = Color(0xFF22C55E);

  /// Success foreground
  static const Color successForeground = Color(0xFFFFFFFF);

  // ============================================================================
  // CHART COLORS
  // ============================================================================

  static const Color chart1 = Color(0xFF3B82F6); // Primary blue
  static const Color chart2 = Color(0xFFEAB308); // Yellow
  static const Color chart3 = Color(0xFFEDEDED); // Light
  static const Color chart4 = Color(0xFFFACD34); // Amber
  static const Color chart5 = Color(0xFF3B82F6); // Primary blue

  // ============================================================================
  // SIDEBAR COLORS
  // ============================================================================

  static const Color sidebarBackground = Color(0xFFFAFBFC);
  static const Color sidebarForeground = Color(0xFF444444);
  static const Color sidebarPrimary = Color(0xFF1F2937);
  static const Color sidebarPrimaryForeground = Color(0xFFFAFBFC);
  static const Color sidebarAccent = Color(0xFFF7F6F5);
  static const Color sidebarAccentForeground = Color(0xFF1F2937);
  static const Color sidebarBorder = Color(0xFFEEEEEE);

  // ============================================================================
  // DARK THEME COLORS (for future use)
  // ============================================================================

  static const Color darkBackground = Color(0xFF1A1A1A);
  static const Color darkForeground = Color(0xFFF2F2F2);
  static const Color darkCard = Color(0xFF373737);
  static const Color darkCardForeground = Color(0xFFF2F2F2);
  static const Color darkPrimary = Color(0xFFFAFAFA);
  static const Color darkPrimaryForeground = Color(0xFF1A1A1A);
  static const Color darkBorder = Color(0xFF4A4A4A);

  // ============================================================================
  // TYPOGRAPHY
  // ============================================================================

  /// Default font family stack
  static const String fontFamily = 'Roboto';

  /// Large heading style (32px, bold)
  static TextStyle headingLarge = const TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.w700,
    height: 1.2,
    letterSpacing: -0.5,
  );

  /// Medium heading style (24px, semibold)
  static TextStyle headingMedium = const TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.w600,
    height: 1.25,
    letterSpacing: -0.25,
  );

  /// Small heading style (20px, semibold)
  static TextStyle headingSmall = const TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    height: 1.3,
  );

  /// Large body text (18px, regular)
  static TextStyle bodyLarge = const TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w400,
    height: 1.5,
    letterSpacing: 0.2,
  );

  /// Medium body text (16px, regular)
  static TextStyle bodyMedium = const TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w400,
    height: 1.5,
    letterSpacing: 0.15,
  );

  /// Small body text (14px, regular)
  static TextStyle bodySmall = const TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.43,
    letterSpacing: 0.1,
  );

  /// Label text (12px, medium weight)
  static TextStyle labelLarge = const TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    height: 1.33,
    letterSpacing: 0.5,
  );

  /// Small label text (11px, medium weight)
  static TextStyle labelSmall = const TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w500,
    height: 1.27,
    letterSpacing: 0.3,
  );

  // ============================================================================
  // SPACING
  // ============================================================================

  static const double spacing2xs = 2.0;
  static const double spacingXs = 4.0;
  static const double spacingSm = 8.0;
  static const double spacingMd = 12.0;
  static const double spacingLg = 16.0;
  static const double spacingXl = 24.0;
  static const double spacing2xl = 32.0;
  static const double spacing3xl = 48.0;

  // ============================================================================
  // BORDER RADIUS
  // ============================================================================

  static const double radiusSm = 4.0;
  static const double radiusMd = 8.0; // Base radius
  static const double radiusLg = 12.0;
  static const double radiusXl = 16.0;
  static const double radiusCircle = 9999.0; // For fully rounded

  // ============================================================================
  // SHADOWS
  // ============================================================================

  /// Extra small shadow
  static const List<BoxShadow> shadowXs = [
    BoxShadow(
      color: Color(0x19000000),
      blurRadius: 3,
      offset: Offset(0, 1),
    ),
  ];

  /// Small shadow (default)
  static const List<BoxShadow> shadowSm = [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 3,
      offset: Offset(0, 1),
    ),
    BoxShadow(
      color: Color(0x19000000),
      blurRadius: 2,
      offset: Offset(0, 1),
    ),
  ];

  /// Medium shadow
  static const List<BoxShadow> shadowMd = [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 3,
      offset: Offset(0, 1),
    ),
    BoxShadow(
      color: Color(0x19000000),
      blurRadius: 4,
      offset: Offset(0, 2),
    ),
  ];

  /// Large shadow
  static const List<BoxShadow> shadowLg = [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 3,
      offset: Offset(0, 1),
    ),
    BoxShadow(
      color: Color(0x19000000),
      blurRadius: 6,
      offset: Offset(0, 4),
    ),
  ];

  /// Extra large shadow
  static const List<BoxShadow> shadowXl = [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 3,
      offset: Offset(0, 1),
    ),
    BoxShadow(
      color: Color(0x19000000),
      blurRadius: 10,
      offset: Offset(0, 8),
    ),
  ];

  /// 2XL shadow
  static const List<BoxShadow> shadow2xl = [
    BoxShadow(
      color: Color(0x40000000),
      blurRadius: 3,
      offset: Offset(0, 1),
    ),
  ];

  // ============================================================================
  // ANIMATIONS / DURATIONS
  // ============================================================================

  static const Duration animationFast = Duration(milliseconds: 150);
  static const Duration animationNormal = Duration(milliseconds: 300);
  static const Duration animationSlow = Duration(milliseconds: 500);

  static const Curve animationCurveEaseIn = Curves.easeIn;
  static const Curve animationCurveEaseOut = Curves.easeOut;
  static const Curve animationCurveEaseInOut = Curves.easeInOut;
  static const Curve animationCurveLinear = Curves.linear;

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /// Get a color with opacity/alpha
  static Color withOpacity(Color color, double opacity) {
    return color.withOpacity(opacity);
  }

  /// Create a theme data object from these tokens
  static ThemeData createLightTheme() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: background,
      primaryColor: primary,
      colorScheme: ColorScheme.light(
        primary: primary,
        onPrimary: primaryForeground,
        secondary: card,
        onSecondary: cardForeground,
        surface: card,
        onSurface: foreground,
        error: destructive,
        onError: destructiveForeground,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: card,
        foregroundColor: foreground,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: input,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: primary, width: 2),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: primaryForeground,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusMd),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primary,
        ),
      ),
      cardTheme: CardTheme(
        color: card,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          side: const BorderSide(color: border),
        ),
      ),
    );
  }
}
