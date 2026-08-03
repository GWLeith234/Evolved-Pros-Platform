import 'server-only'

// SPRINT A — Guest Artwork Studio. Single source of truth for the locked house
// watercolour style. NOTHING else in the codebase may hardcode this prompt or
// model name — import from here so a style change is one edit, everywhere.

export const GUEST_PORTRAIT_MODEL = 'grok-imagine-image-quality'

export const GUEST_PORTRAIT_PROMPT = `Render this photograph as a soft, realistic watercolour portrait on cold-pressed paper with visible paper tooth. Preserve the subject's facial likeness, bone structure, hairline and expression exactly as they appear in the source photograph. Compose as head and shoulders, centred, facing the viewer, eyeline in the upper third with generous headroom above the head, cropped at mid-chest, shoulders running out past the left and right edges of the frame. Replace the background entirely with a full-bleed mottled wash of cool pale grey-blue and soft slate, laid in broad vertical brushstrokes with visible wet edges and pigment pooling, covering the entire background from edge to edge behind and around the subject. Dress the subject in a dark navy blazer over an open-collar shirt in white or slate-blue. Soft frontal light, a warm blush on the cheeks and nose, fine ink linework defining the eyes, nose and mouth, wet-on-wet blending with darker navy pooling in the clothing. Muted, restrained palette. NEGATIVE: no splatter, no paint drips, no spray, no halo, no vignette, no white or cream empty background, no blank paper, no text, no letters, no logos, no watermark, no border.`
