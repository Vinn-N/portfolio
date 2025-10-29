# Project Structure

## Directory Organization

### Root Level
- `index.html` - Main landing page with hero section and project overview
- `README.md` - Project documentation and deployment information
- `global_solar_resource_map.html` - Standalone solar resource visualization

### Source Directory (`src/`)
**Core Pages:**
- `about.html` - Personal background and academic information
- `_config.yml` - Jekyll configuration for GitHub Pages

**Assets (`src/assets/`):**
- `favicon/` - Complete favicon set for cross-platform compatibility
- `project/` - Project-specific images and documentation organized by project
- Social media icons (SVG format)
- Profile images and branding assets

**Styling (`src/css/`):**
- `style.css` - Main stylesheet with theme support and responsive design
- `utilities.css` - Utility classes and helper styles

**Functionality (`src/js/`):**
- `script.js` - Interactive features, theme switching, and animations

**Project Pages (`src/projects/`):**
- Individual HTML pages for each major project
- Detailed project documentation and media

### Configuration & Deployment
**GitHub Integration (`.github/`):**
- `workflows/static.yml` - GitHub Actions for automated deployment
- Issue templates for bug reports, documentation, and features
- Pull request template for contribution guidelines

**Project Management:**
- `CODE_OF_CONDUCT.md` - Community guidelines
- `CONTRIBUTING.md` - Contribution instructions
- `REQUIREMENTS.md` - Technical requirements and dependencies

## Core Components

### Navigation System
- Responsive navbar with hamburger menu for mobile
- Theme toggle functionality
- Social media integration

### Project Showcase
- Grid-based project display
- Individual project detail pages
- Research and engineering project categorization

### Visual Design
- Dark/light theme support
- Animated background elements (stars, petals)
- Responsive grid layouts
- Professional typography and spacing

## Architectural Patterns
- **Static Site Architecture**: Pure HTML/CSS/JS for fast loading and easy deployment
- **Component-Based Styling**: Modular CSS with utilities for consistent design
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Mobile-First Design**: Responsive layouts prioritizing mobile experience