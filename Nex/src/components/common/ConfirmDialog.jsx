import { Modal } from './Modal.jsx'
import { Button } from './Button.jsx'

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  confirmLoading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} size="sm" title={title}>
      {message && <p className="confirm-message">{message}</p>}
      <footer className="modal-footer">
        <Button variant="ghost" onClick={onClose} disabled={confirmLoading}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={confirmLoading}>
          {confirmLabel}
        </Button>
      </footer>
    </Modal>
  )
}

export default ConfirmDialog