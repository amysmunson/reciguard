import React from 'react';
import { Modal } from 'react-native';
import DialogHost from './DialogHost';
import OfflineBanner from './OfflineBanner';

// Use instead of react-native's Modal for every in-app modal. Same props;
// it also mounts a DialogHost inside the modal, so an appAlert() raised
// while this modal is open (a save error, a "Discard changes?" prompt)
// shows on top of it. See lib/app/dialog.js. It also adds the offline banner,
// since the modal covers the one App.js draws.
const AppModal = ({ children, ...props }) => (
  <Modal {...props}>
    {children}
    {props.visible ? <OfflineBanner /> : null}
    {props.visible ? <DialogHost /> : null}
  </Modal>
);

export default AppModal;
