# Development Guidelines

## Code Quality Standards

### JavaScript Patterns
- **Vanilla JavaScript**: Pure JavaScript without external frameworks for lightweight performance
- **DOM Safety**: Always check element existence before manipulation (`if (element) { ... }`)
- **Event Delegation**: Use `addEventListener` for all event handling with proper cleanup
- **Functional Organization**: Group related functionality with clear section comments (e.g., `// 1. MOBILE MENU`)
- **Defensive Programming**: Handle null/undefined cases gracefully throughout the codebase

### CSS Architecture
- **CSS Variables**: Extensive use of custom properties for theming and consistency
- **Theme System**: Dual theme support using `[data-theme="dark"]` attribute selectors
- **Mobile-First**: Responsive design with progressive enhancement for larger screens
- **Component Isolation**: Modular CSS with clear section separation and utility classes
- **Performance Optimization**: Minimal external dependencies, optimized animations

### HTML Structure
- **Semantic Markup**: Proper use of HTML5 semantic elements (`<header>`, `<section>`, `<article>`)
- **Accessibility**: ARIA labels, proper heading hierarchy, and keyboard navigation support
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Meta Tags**: Comprehensive meta tag setup for SEO and social sharing

## Naming Conventions

### CSS Classes
- **BEM-inspired**: Descriptive class names like `.hero-layout`, `.project-bio`, `.theme-switch`
- **Utility Classes**: Separate utility stylesheet for reusable components (`.btn`, `.container`)
- **State Classes**: Clear state indicators (`.active`, `.light-only`, `.visually-hidden`)

### JavaScript Variables
- **Descriptive Names**: Clear, self-documenting variable names (`toggleSwitch`, `starWrapper`)
- **Consistent Patterns**: Similar naming for related elements (`navLeft`, `navRight`)
- **Constants**: Use descriptive constants for configuration values (`petalInterval`, `STORAGE_KEY`)

### File Organization
- **Logical Grouping**: Assets organized by type and purpose (`favicon/`, `project/`, `css/`)
- **Descriptive Names**: Clear file naming that indicates content and purpose
- **Consistent Structure**: Parallel organization across similar content types

## Development Patterns

### Theme Management
```javascript
// Persistent theme with system preference fallback
const saved = localStorage.getItem(STORAGE_KEY);
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const initial = saved || (systemPrefersDark ? 'dark' : 'light');
```

### Animation Implementation
- **CSS Variables for Animation**: Use custom properties for dynamic animation values
- **Performance Considerations**: `transform` and `opacity` for smooth animations
- **Accessibility Respect**: `@media (prefers-reduced-motion: reduce)` support
- **Cleanup**: Proper event listener cleanup for dynamically created elements

### Responsive Design
- **Grid-First**: CSS Grid for complex layouts with Flexbox for alignment
- **Breakpoint Strategy**: Mobile-first with specific breakpoints (768px, 1000px)
- **Flexible Units**: `clamp()`, `vw`, and relative units for scalable design
- **Container Queries**: Max-width containers with auto margins for centering

### State Management
- **Local Storage**: Persistent user preferences with fallback handling
- **DOM State**: Use classes and data attributes for visual state changes
- **Event-Driven**: Reactive updates based on user interactions and system changes

## Performance Guidelines

### Asset Optimization
- **SVG Icons**: Vector graphics for scalable, crisp icons across all devices
- **Image Compression**: Optimized project images with appropriate formats
- **Font Loading**: Strategic font loading with fallback system fonts
- **Minimal Dependencies**: Single external dependency (Font Awesome) with specific version

### JavaScript Efficiency
- **Event Delegation**: Efficient event handling with minimal listeners
- **Animation Frames**: `requestAnimationFrame` for smooth animations
- **Lazy Creation**: Dynamic element creation only when needed
- **Memory Management**: Proper cleanup of event listeners and DOM elements

### CSS Performance
- **Efficient Selectors**: Avoid deep nesting, use specific class selectors
- **Hardware Acceleration**: `transform3d` and `translateZ(0)` for GPU acceleration
- **Critical CSS**: Inline critical styles, external stylesheets for enhancement
- **Reduced Reflows**: Use `transform` and `opacity` for animations

## Accessibility Standards

### Keyboard Navigation
- **Focus Management**: Proper tab order and focus indicators
- **ARIA Labels**: Descriptive labels for interactive elements
- **Screen Reader Support**: `.visually-hidden` class for screen reader content

### Visual Accessibility
- **Color Contrast**: High contrast ratios in both light and dark themes
- **Motion Sensitivity**: Respect for `prefers-reduced-motion` user preference
- **Scalable Text**: Relative units and responsive typography

### Semantic Structure
- **Heading Hierarchy**: Logical heading structure (h1 → h2 → h3)
- **Landmark Roles**: Proper use of semantic HTML5 elements
- **Alternative Text**: Descriptive alt text for all images