import React from 'react';
import { Modal } from 'react-native';
import DialogHost from './DialogHost';

// Use instead of react-native's Modal for every in-app modal. Same props;
// it also mounts a DialogHost inside the modal, so an appAlert() raised
// while this modal is open (a save error, a "Discard changes?" prompt)
// shows on top of it. See lib/dialog.js.
const AppModal = ({ children, ...props }) => (
  <Modal {...props}>
    {children}
    {props.visible ? <DialogHost /> : null}
  </Modal>
);

export default AppModal;
