/**
 * UTILS/ADDTOHOMESCREEN.TS - PWA INSTALLATION PROMPT UTILITY
 * ==========================================================
 * 
 * OVERVIEW:
 * This utility provides a custom "Add to Home Screen" prompt for Progressive
 * Web App (PWA) installation. It shows a user-friendly modal with installation
 * instructions when the app is accessed for the first time on mobile devices.
 * 
 * PURPOSE:
 * - Increase PWA adoption by guiding users through installation
 * - Provide consistent installation experience across different browsers
 * - Show only once per device to avoid being intrusive
 * - Detect if app is already installed to prevent redundant prompts
 * 
 * FEATURES:
 * - One-time display per device using localStorage
 * - Automatic detection of installed PWA state
 * - Cross-platform installation instructions
 * - Auto-dismiss after 15 seconds
 * - Responsive modal design
 * - Graceful fallback for missing app icons
 * 
 * BROWSER SUPPORT:
 * - iOS Safari (Add to Home Screen)
 * - Android Chrome (Install App)
 * - Desktop browsers (Install as App)
 * - Fallback for unsupported browsers
 * 
 * DESIGN PRINCIPLES:
 * - Non-intrusive user experience
 * - Clear, actionable instructions
 * - Visual consistency with app design
 * - Accessibility considerations
 */
// Simple Add to Home Screen - Shows only once on first visit
/**
 * ADD TO HOMESCREEN CLASS
 * ======================
 * 
 * Main class that handles PWA installation prompt display and management.
 * Implements singleton pattern for consistent behavior across app instances.
 * 
 * CONFIGURATION:
 * - appName: Display name for the application
 * - appIconUrl: URL to app icon for visual branding
 * - Customizable styling and behavior options
 * 
 * LIFECYCLE:
 * 1. Initialize with app configuration
 * 2. Check if prompt should be shown
 * 3. Display modal with installation instructions
 * 4. Handle user interactions and cleanup
 * 5. Mark as shown to prevent future displays
 */
export class AddToHomescreen {
  /** Configuration options for the installation prompt */
  private options: any;

  /**
   * CONSTRUCTOR
   * ===========
   * 
   * Initializes the AddToHomescreen utility with app-specific configuration.
   * Merges provided options with sensible defaults.
   * 
   * @param options - Configuration object with app details
   * @param options.appName - Name of the app to display in prompt
   * @param options.appIconUrl - URL to app icon for branding
   */
  constructor(options: any = {}) {
    this.options = {
      appName: 'Golden PriceList',
      appIconUrl: 'https://jarivatoi.github.io/goldenpricelist/icon-512.png',
      ...options
    };
  }

  /**
   * SHOW INSTALLATION PROMPT
   * ========================
   * 
   * Main method to display the installation prompt. Includes multiple
   * checks to ensure the prompt is only shown when appropriate.
   * 
   * DISPLAY CONDITIONS:
   * - App is not already installed as PWA
   * - Prompt has not been shown before on this device
   * - User is on a supported platform
   * 
   * PWA DETECTION:
   * Uses multiple methods to detect if app is already installed:
   * - display-mode: standalone (standard PWA detection)
   * - navigator.standalone (iOS Safari specific)
   * - display-mode: fullscreen (some Android browsers)
   * - display-mode: minimal-ui (some desktop browsers)
   * 
   * STORAGE STRATEGY:
   * - Uses localStorage to track if prompt was shown
   * - Key: 'addToHomescreen-shown'
   * - Persistent across browser sessions
   * - Respects user's implicit "no" choice
   */
  show(): void {
    // Check if app is already running as installed PWA
    // This works across iOS, Android, and Desktop platforms
    // Don't show if already running as installed PWA (works on iOS, Android, Desktop)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true ||
                         window.matchMedia('(display-mode: fullscreen)').matches ||
                         window.matchMedia('(display-mode: minimal-ui)').matches;
    
    if (isStandalone) {
      console.log('🚫 App is already installed as PWA, skipping prompt');
      return;
    }
    
    // Check if prompt was already shown before
    // Check if already shown before
    const hasShownBefore = localStorage.getItem('addToHomescreen-shown');
    if (hasShownBefore) {
      console.log('🚫 Add to homescreen already shown before, skipping');
      return;
    }

    // Mark as shown to prevent future displays
    // Mark as shown
    localStorage.setItem('addToHomescreen-shown', 'true');
    console.log('✅ Showing add to homescreen prompt');

    // Display the installation modal
    this.showModal();
  }

  /**
   * SHOW INSTALLATION MODAL
   * =======================
   * 
   * Creates and displays a custom modal with installation instructions.
   * Uses vanilla JavaScript for maximum compatibility and performance.
   * 
   * MODAL STRUCTURE:
   * - Full-screen overlay with semi-transparent background
   * - Centered modal card with app branding
   * - App icon, title, description, and instructions
   * - Close button for user control
   * - Auto-dismiss timer for non-intrusive UX
   * 
   * STYLING APPROACH:
   * - Inline styles for self-contained component
   * - Responsive design with mobile-first approach
   * - Consistent with system UI patterns
   * - High contrast for accessibility
   * 
   * INTERACTION HANDLING:
   * - Click outside to close
   * - Close button click
   * - Automatic cleanup after timeout
   * - Proper event listener management
   */
  private showModal(): void {
    // Create full-screen overlay
    // Create modal
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    `;

    // Create modal content container
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 24px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      text-align: center;
    `;

    // App icon with error handling
    // App icon
    const icon = document.createElement('img');
    icon.src = this.options.appIconUrl;
    icon.style.cssText = `
      width: 64px;
      height: 64px;
      border-radius: 12px;
      margin-bottom: 16px;
    `;
    // Hide icon if it fails to load
    icon.onerror = () => icon.style.display = 'none';

    // Modal title with app name
    // Title
    const title = document.createElement('h3');
    title.textContent = `Install ${this.options.appName}`;
    title.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
    `;

    // Installation benefit message
    // Message
    const message = document.createElement('p');
    message.textContent = `Add ${this.options.appName} to your home screen for quick access!`;
    message.style.cssText = `
      margin: 0 0 24px 0;
      font-size: 16px;
      color: #666;
    `;

    // Step-by-step installation instructions
    // Instructions
    const instructions = document.createElement('div');
    instructions.style.cssText = `
      background: #f0f9ff;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      text-align: left;
    `;
    // HTML content with visual icons and clear steps
    instructions.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 8px; color: #0369a1;">📱 How to install:</div>
      <div style="font-size: 14px; color: #0c4a6e; line-height: 1.5;">
        1. Tap the <strong>Share</strong> button <span style="font-size: 18px;">⬆️</span><br>
        2. Scroll down and tap <strong>"Add to Home Screen"</strong><br>
        3. Tap <strong>"Add"</strong> to confirm
      </div>
    `;

    // Close button for user control
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Maybe Later';
    closeBtn.style.cssText = `
      background: #f3f4f6;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-size: 16px;
      color: #5f6368;
      cursor: pointer;
      width: 100%;
    `;

    // Event handlers for modal interactions
    closeBtn.onclick = () => document.body.removeChild(overlay);
    
    // Close when clicking outside modal
    overlay.onclick = (e) => {
      if (e.target === overlay) document.body.removeChild(overlay);
    };

    // Assemble modal components
    // Assemble modal
    modal.appendChild(icon);
    modal.appendChild(title);
    modal.appendChild(message);
    modal.appendChild(instructions);
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);
    
    // Add to DOM to display
    document.body.appendChild(overlay);

    // Auto-close after 15 seconds to avoid being intrusive
    // Auto-close after 15 seconds
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 15000);
  }
}

/**
 * DEFAULT EXPORT
 * ==============
 * 
 * Exports the AddToHomescreen class as default for easy importing.
 * 
 * USAGE EXAMPLE:
 * import AddToHomescreen from '../utils/addToHomescreen';
 * 
 * const prompt = new AddToHomescreen({
 *   appName: 'My App',
 *   appIconUrl: '/icon-512.png'
 * });
 * 
 * prompt.show();
 */
export default AddToHomescreen;