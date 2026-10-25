import db from '../db.js';

// action = 'read' | 'edit' | 'owner'
export function checkPermission(action) {
  return (req, res, next) => {
    const docId = req.params.id || req.body?.documentId;
    const userId = req.user.id;
    const role = req.user.role;

    // Admin role can bypass here as per policy, or restrict further as needed
    if (role === 'admin') return next();

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Owner always allowed
    if (doc.ownerId === userId) return next();

    const perm = db
      .prepare('SELECT * FROM document_permissions WHERE documentId = ? AND userId = ?')
      .get(docId, userId);

    if (!perm) return res.status(403).json({ error: 'Access denied' });

    if (
      action === 'read' &&
      ['read', 'edit', 'owner'].includes(perm.permission)
    )
      return next();
    if (action === 'edit' && ['edit', 'owner'].includes(perm.permission))
      return next();
    if (action === 'owner' && perm.permission === 'owner') return next();

    return res.status(403).json({ error: 'Insufficient permission' });
  };
}
