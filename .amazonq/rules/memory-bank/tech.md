# Technology Stack

## Core Technologies
- **HTML5**: Semantic markup with modern web standards
- **CSS3**: Custom styling with CSS Grid, Flexbox, and CSS variables for theming
- **Vanilla JavaScript**: Interactive features without external frameworks
- **Jekyll**: Static site generation for GitHub Pages deployment

## Development Environment
- **Version Control**: Git with GitHub for source control and collaboration
- **Deployment**: GitHub Pages with automated deployment via GitHub Actions
- **Development Tools**: Gitpod integration for cloud-based development

## Dependencies & External Resources
- **Font Awesome 5.15.4**: Icon library for UI elements
- **Google Fonts**: Custom typography (loaded via CSS)
- **Favicon Generator**: Multi-platform favicon support

## Build & Deployment
**GitHub Actions Workflow:**
- Automated static site deployment
- Triggered on push to main branch
- No build process required (static files)

**Development Commands:**
```bash
# Local development (simple HTTP server)
python -m http.server 8000
# or
npx serve .

# Git workflow
git add .
git commit -m "Update content"
git push origin main
```

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Progressive enhancement for older browsers

## Performance Optimizations
- **Static Assets**: No runtime dependencies or build process
- **Optimized Images**: Compressed project images and icons
- **Minimal JavaScript**: Lightweight interactive features
- **CSS Grid/Flexbox**: Modern layout without framework overhead
- **SVG Icons**: Scalable vector graphics for crisp display

## File Structure Standards
- **Semantic HTML**: Proper heading hierarchy and ARIA labels
- **Modular CSS**: Separate utility and component stylesheets
- **Asset Organization**: Logical grouping of images, icons, and documents
- **Clean URLs**: Descriptive file names and directory structure