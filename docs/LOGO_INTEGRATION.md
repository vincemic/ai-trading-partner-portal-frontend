# PointC Logo Integration

## Logo Assets Added

The PointC Trading Portal now includes proper branding with professional logo assets inspired by the PointChealth.com design system.

### Logo Files Available

- `portal-logo-primary.svg` - Primary logo with PointC branding and "TRADING PORTAL" subtitle
- `portal-logo-compact.svg` - Compact version for mobile and small spaces  
- `portal-icon-primary.svg` - Icon-only version for favicons and app icons
- `portal-logo-monochrome-dark.svg` - Dark monochrome version
- `portal-logo-monochrome-light.svg` - Light monochrome version for dark backgrounds

### Logo Design Features

- **Concentric Circle Icon**: Inspired by PointC's signature circular design elements
- **Color Scheme**: Uses the established Point C brand colors:
  - Primary Navy: #021B38
  - Coral Accent: #DE4843  
  - Blue-Gray: #727B9C
- **Typography**: Clean, professional fonts with PointC wordmark
- **Scalable SVG**: Vector format ensures crisp display at all sizes

### Implementation

The logos are integrated throughout the application:

- **Login Page**: Features the primary logo with PointC branding
- **Navigation Bar**: Shows the primary logo in the top navbar
- **Favicon**: Uses the icon-only version
- **Page Title**: Updated to "PointC Trading Portal"

### Logo Usage Guidelines

1. **Primary Logo**: Use for main branding and headers
2. **Compact Logo**: Use in mobile views and space-constrained areas
3. **Icon Only**: Use for favicons, app icons, and minimal spaces
4. **Monochrome**: Use when color logos don't fit the design context

### Asset Location

- **Source**: `src/assets/logos/` (development)
- **Public**: `public/assets/logos/` (build output)
- **Built**: `dist/portal-frontend/browser/assets/logos/` (production)

The logo assets are automatically included in the production build and ready for deployment to the ASP.NET Core backend.

## Brand Consistency

The logo implementation follows the Point C design system specifications and maintains consistency with:

- Color palette and typography
- Professional healthcare software aesthetic  
- Responsive design principles
- Accessibility standards

This creates a cohesive brand experience throughout the Trading Partner Portal application.