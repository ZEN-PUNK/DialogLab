# Scene Canvas Zoom Feature

## Overview
The scene canvas now supports zooming in and out, making it easier to work with multiple avatars without them overlapping. This feature allows you to scale from 50% to 300% of the original size.

## How to Use

### Zoom In/Out Buttons
Located in the top-right corner of the scene canvas:
- **Zoom In** (🔍+): Increases the zoom level by 20%
- **Zoom Out** (🔍-): Decreases the zoom level by 20%
- **Percentage Display**: Shows current zoom level (e.g., "100%", "150%")
- **Reset Button** (⟲): Returns zoom to 100% (1:1 scale)

### Keyboard Shortcut (Ctrl/Cmd + Scroll)
While hovering over the scene canvas:
- **Ctrl + Scroll Up** (Windows/Linux) or **Cmd + Scroll Up** (Mac): Zoom in smoothly
- **Ctrl + Scroll Down** (Windows/Linux) or **Cmd + Scroll Down** (Mac): Zoom out smoothly

Each scroll increment changes zoom by 20%.

### Zoom Range
- **Minimum**: 50% (view the entire scene from far away)
- **Maximum**: 300% (zoom in to see fine details)
- **Default**: 100% (normal 1:1 scale)

## Features

✅ **Smooth Zoom Animation**: Zoom changes animate smoothly for better UX
✅ **Pan Support**: When zoomed in, use scrollbars to pan around the scene
✅ **Responsive Zoom Origin**: Zoom is anchored to the top-center of the canvas for consistent behavior
✅ **Per-Scene Zoom**: Each scene maintains its own zoom level
✅ **No Zoom Constraints**: Avatars, content, and UI remain fully interactive at any zoom level

## Use Cases

### Multiple Avatar Arrangement
When adding 3+ avatars to a scene:
1. Zoom out to 70-80% to see all avatars at once
2. Arrange them without overlap
3. Zoom back in to fine-tune positioning

### Detail Work
When fine-tuning avatar positions or styling:
1. Zoom in to 150-200%
2. Make precise adjustments
3. Reset zoom (50%) to verify final layout

### Content Verification
When checking entire scene composition:
1. Zoom out to 50-75%
2. Verify visual balance and spacing
3. Zoom back to 100% for normal work

## Technical Details

**Implementation**:
- CSS `transform: scale()` for smooth, GPU-accelerated zooming
- Container overflow changed from `hidden` to `auto` for scrolling support
- Zoom state maintained in React component state
- Smooth 0.1s transitions between zoom levels

**Files Modified**:
- `client/src/components/avatarconfig/SceneSetup.jsx`
  - Added zoom state and ref management
  - Added zoom event listeners (mouse wheel)
  - Added zoom control buttons UI
  - Wrapped scene content in scalable container

**Keyboard Modifiers Required**:
✓ Ctrl (Windows/Linux) or Cmd (Mac) must be held while scrolling to trigger zoom
✓ This prevents accidental zoom when scrolling normally through content

## Troubleshooting

### Zoom not working?
- Ensure Ctrl (or Cmd on Mac) is held while scrolling
- Verify your cursor is over the scene canvas
- Check that the zoom controls are visible in the top-right corner

### Avatars look blurry at high zoom?
- This is normal with CSS scaling at extreme zoom levels
- Reduce zoom to 150-200% for clearer visuals
- The avatars themselves are rendered at full quality

### Can't scroll to see off-screen content when zoomed?
- The scrollbars appear automatically when content exceeds the container
- Use mouse scroll or drag the scrollbars to pan
- Zoom out to reset the view

### Zoom level resets when switching scenes?
- This is normal - each scene has its own independent zoom level
- Zoom level is not persisted to storage (resets on page refresh)

## Future Enhancements

Potential improvements for this feature:
- [ ] Zoom level persistence in saved scenes
- [ ] Pinch-to-zoom support for trackpads/touch
- [ ] Scroll-to-zoom option without requiring Ctrl/Cmd modifier
- [ ] Zoom animation easing curves
- [ ] Double-click to zoom to fit all avatars
- [ ] Zoom history (undo/redo zoom levels)
- [ ] Zoom presets (fit-to-window, actual size, etc.)

## Compatibility

✅ **Browser Support**:
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

✅ **Operating Systems**:
- Windows (Ctrl + Scroll)
- macOS (Cmd + Scroll)
- Linux (Ctrl + Scroll)

## Tips & Tricks

💡 **Pro Tips**:
1. Start at 50% zoom to see the complete scene layout before adding avatars
2. Use Ctrl+Scroll for quick, continuous zoom adjustments
3. Click the reset button (⟲) to quickly return to 100% if you get lost
4. Organize avatars in rows or columns when zoomed out - it's easier to see overlaps
5. Zoom to 200% when fine-tuning avatar positions for pixel-perfect placement

## See Also
- [Avatar Configuration Guide](re-eng/AI-CODEC-RESEARCH-TEAM.md)
- [SceneSetup Component](client/src/components/avatarconfig/SceneSetup.jsx)
