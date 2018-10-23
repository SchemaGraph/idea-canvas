import * as React from 'react';
import styled from 'styled-components';
import { Button, Dialog, Classes } from '@blueprintjs/core';
import { connect } from '../utils';
import { Properties } from './properties-form';
interface Props {
  id?: string;
  onClose?: () => void;
  isMobile?: boolean;
}
class EditDialogBase extends React.Component<Props> {
  public render() {
    const { id, onClose, isMobile } = this.props;
    return (
      <Dialog
        isOpen={isMobile && !!id}
        onClose={onClose}
        title="Edit"
        autoFocus={true}
        canEscapeKeyClose={true}
        canOutsideClickClose={true}
        usePortal={true}
        enforceFocus={true}
      >
        <div className={Classes.DIALOG_BODY}>
          <Properties id={id} />
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </Dialog>
    );
  }
}

export const EditDialog = connect<Props>((store, _) => ({
  id: store.deepEditing || undefined,
  onClose: () => store.setDeepEditing(null),
  isMobile: store.isMobile,
}))(EditDialogBase);
