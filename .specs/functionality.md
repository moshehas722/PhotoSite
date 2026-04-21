# Functionality

PhotoSite is a gallery for photos stored in a private Google Drive folder, with optional Google Sign-In and a "pay to download full-resolution" flow.

## Browsing (public)

- Anyone can reach the site and browse photos without signing in.
- The home page shows the contents of the configured top-level Drive folder: thumbnails in a masonry grid, subfolders listed as clickable tiles.
- The left sidebar is a collapsible folder tree. Each node lazy-loads its children the first time it is expanded. The tree does not reconstruct the full ancestor chain on deep links — deep-linking to `/folder/<id>` works, but only the root + whatever the user has expanded shows.
- Clicking a photo opens a fullscreen lightbox with prev/next navigation.
- In the lightbox, non-purchased photos are shown at thumbnail resolution (220px) stretched to viewport height. A notice reads: *"This is a low-res picture. Full-res picture will be available only after purchasing."* This is the IP-protection mechanism — the server never streams full-resolution bytes for photos the user has not purchased.

## Authentication (optional)

- The header shows a "Sign in with Google" button when signed out.
- If the browser is already signed into Google, a Google One Tap prompt appears in the top-right.
- Signed-in users see their avatar, name, and a "Sign out" button in the header.
- Sessions persist across page reloads via a cookie.

## Cart (signed-in only)

- A "+" button appears on each photo card on hover when signed in. Clicking it adds the photo to the cart; clicking again removes it.
- The cart button in the header opens a drawer listing cart items with thumbnails and a "Remove" control per item.
- Cart contents are persisted to `localStorage` under `photosite.cart`, so they survive page reloads.
- The cart is cleared automatically when the user signs out.

## Checkout and purchases

- Clicking "Accept Cart" in the drawer calls `POST /api/purchases`, which writes one document per (user, photo) pair to Firestore.
- No payment is processed — purchases are effectively free. A Stripe integration can be added later (the purchase-recording would move into a Stripe webhook handler).
- On success the drawer shows "Purchase complete" for 2s, clears the cart, and closes.

## Post-purchase experience

- Purchased photos show a "✓ Purchased" badge on the card instead of the "+" button.
- Opening a purchased photo in the lightbox loads the full-resolution image (via the gated `/api/photos/:id/full` endpoint) and shows a "Download full resolution" button.
- A "My Purchases" page (`/purchases`, reachable from the header) lists all purchased photos with thumbnails and direct download links.
- The full-resolution endpoint requires both authentication (user is signed in) and ownership (Firestore has a matching purchase document). Anyone else gets a 403.
