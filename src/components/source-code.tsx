import * as React from 'react';
import styled from 'styled-components';
import {
  H5,
  FormGroup,
  InputGroup,
  Button,
  MenuItem,
  Label,
  Icon,
  ButtonGroup,
  Divider,
} from '@blueprintjs/core';
import { colors } from '../theme/theme';
import { connect } from '../utils';
import { IStore } from '../store';
import { observer } from 'mobx-react';
import { IGraph, IGraphSnapshot } from '../graph-store';
import { Controlled as CodeMirror } from 'react-codemirror2';
import { getSnapshot, onSnapshot, applySnapshot } from 'mobx-state-tree';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/javascript/javascript';
import { IDisposer } from 'mobx-state-tree/dist/utils';

const Container = styled.div`
  height: 100%;
`;
interface Props {
  graph: IGraph;
  graphSnapshot: IGraphSnapshot;
}

interface State {
  skipNext: boolean;
  serialized: string;
}

class SourceCodeBase extends React.Component<Props, State> {
  private disposer: IDisposer | undefined;
  private editor: any;
  private containerRef = React.createRef<HTMLDivElement>();
  static defaultProps = {
    graph: {},
  };
  public state = {
    skipNext: false,
    serialized: '{}',
  };
  public componentDidMount() {
    this.initialize();
  }
  public componentWillUnMount() {
    if (this.disposer) {
      this.disposer();
    }
  }

  public componentDidUpdate(prevProps: Props, prevState: State) {
    // when we apply the snapshot ourselves, we don't want to
    // rewrite the source code (since it's unchanged)
    if (prevProps.graphSnapshot !== this.props.graphSnapshot) {
      if (!this.state.skipNext) {
        this.setState({
          serialized: JSON.stringify(this.props.graphSnapshot, undefined, 2),
        });
      } else {
        this.setState({
          skipNext: false,
        });
      }
    }
  }
  private initialize() {
    this.setState({
      serialized: JSON.stringify(this.props.graphSnapshot, undefined, 2),
    });
    if (this.editor && this.containerRef.current) {
      this.editor.setSize(
        '100%',
        `${this.containerRef.current.clientHeight - 50}px`
      );
    }
  }
  private handleChange = (_editor: any, _data: any, value: any) => {
    try {
      applySnapshot(this.props.graph, JSON.parse(value));
      this.setState({
        serialized: value,
        skipNext: true,
      });
    } catch (error) {
      // console.error(error);
      this.setState({ serialized: value, skipNext: false });
    }
  };
  private handleEditorMount = (editor: any, _value: string, cb: () => void) => {
    if (this.containerRef.current) {
      editor.setSize(`${this.containerRef.current.clientHeight}px`, '100%');
    }
    this.editor = editor;
    cb();
  };
  public render() {
    return (
      <Container innerRef={this.containerRef}>
        <CodeMirror
          value={this.state.serialized}
          onBeforeChange={this.handleChange}
          options={{
            mode: { name: 'javascript'},
            lineNumbers: true,
            theme: 'material',
          }}
          editorDidMount={this.handleEditorMount}
        />
      </Container>
    );
  }
}

export const SourceCode = connect<Props>((store, _) => ({
  graph: store.graph,
  graphSnapshot: store.undoManager.snapshot,
}))(observer(SourceCodeBase as any));
