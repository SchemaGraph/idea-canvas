import React from 'react';
import Split from 'split.js';
import styled from 'styled-components';

const Container = styled.div`
    height: 100%;
    width: 100%;
    display: flex;
`;


type Props = Split.Options & {
  collapsed: number;
  expandToMin: any;
  gutterSize: any;
  gutterAlign: any;
  snapOffset: any;
  dragInterval: any;
};

class SplitWrapper extends React.Component<Props> {
  static defaultProps = {
    sizes: undefined,
    minSize: undefined,
    expandToMin: undefined,
    gutterSize: undefined,
    gutterAlign: undefined,
    snapOffset: undefined,
    dragInterval: undefined,
    direction: undefined,
    cursor: undefined,
    gutter: undefined,
    elementStyle: undefined,
    gutterStyle: undefined,
    onDrag: undefined,
    onDragStart: undefined,
    onDragEnd: undefined,
    collapsed: undefined,
    children: undefined,
  };

  split: Split.Instance | undefined;
  parent = React.createRef<HTMLDivElement>();
  componentDidMount() {
    if (!this.parent.current) {
      return;
    }
    const parent = this.parent.current;
    const { children, ...options } = this.props;

    const gutter = options.gutter;
    options.gutter = (index, direction) => {
      let gutterElement;

      if (gutter) {
        gutterElement = gutter(index, direction);
      } else {
        gutterElement = document.createElement('div');
        gutterElement.className = `gutter gutter-${direction}`;
      }

      // eslint-disable-next-line no-underscore-dangle
      (gutterElement as any).__isSplitGutter = true;
      return gutterElement;
    };

    this.split = Split(parent.children as any, options);
  }

  componentDidUpdate(prevProps: Props) {
    if (!this.split || !this.parent.current) {
      return;
    }
    const parent = this.parent.current;
    const { children, minSize, sizes, collapsed, ...rest } = this.props;
    const {
      minSize: prevMinSize,
      sizes: prevSizes,
      collapsed: prevCollapsed,
    } = prevProps;

    const options: { [key: string]: any } = {
      ...rest,
    };
    const otherProps = [
      'expandToMin',
      'gutterSize',
      'gutterAlign',
      'snapOffset',
      'dragInterval',
      'direction',
      'cursor',
    ];

    let needsRecreate = otherProps
      // eslint-disable-next-line react/destructuring-assignment
      .map(prop => (this.props as any)[prop] !== (prevProps as any)[prop])
      .reduce((accum, same) => accum || same, false);

    // Compare minSize when both are arrays, when one is an array and when neither is an array
    if (Array.isArray(minSize) && Array.isArray(prevMinSize)) {
      let minSizeChanged = false;

      minSize.forEach((minSizeI, i) => {
        minSizeChanged = minSizeChanged || minSizeI !== prevMinSize[i];
      });

      needsRecreate = needsRecreate || minSizeChanged;
    } else if (Array.isArray(minSize) || Array.isArray(prevMinSize)) {
      needsRecreate = true;
    } else {
      needsRecreate = needsRecreate || minSize !== prevMinSize;
    }

    // Destroy and re-create split if options changed
    if (needsRecreate) {
      options.minSize = minSize;
      options.sizes = this.split.getSizes();
      (this.split as any).destroy(true, true);
      options.gutter = (index: any, direction: any, pairB: any) =>
        pairB.previousSibling;
      this.split = Split(
        Array.from(parent.children).filter(
          // eslint-disable-next-line no-underscore-dangle
          element => !(element as any).__isSplitGutter
        ) as any,
        options
      );
    } else {
      // If only the size has changed, set the size. No need to do this if re-created.
      let sizeChanged = false;

      sizes!.forEach((sizeI, i) => {
        sizeChanged = sizeChanged || sizeI !== prevSizes![i];
      });

      if (sizeChanged) {
        // eslint-disable-next-line react/destructuring-assignment
        this.split.setSizes(this.props.sizes!);
      }
    }

    // Collapse after re-created or when collapsed changed.
    if (
      Number.isInteger(collapsed) &&
      (collapsed !== prevCollapsed || needsRecreate)
    ) {
      this.split.collapse(collapsed);
    }
  }

  componentWillUnmount() {
    if (this.split) {
      this.split.destroy();
      delete this.split;
    }
  }

  render() {
    const {
      sizes,
      minSize,
      expandToMin,
      gutterSize,
      gutterAlign,
      snapOffset,
      dragInterval,
      direction,
      cursor,
      gutter,
      elementStyle,
      gutterStyle,
      onDrag,
      onDragStart,
      onDragEnd,
      collapsed,
      children,
      ...rest
    } = this.props;

    return (
      <Container innerRef={this.parent} {...rest}>
        {children}
      </Container>
    );
  }
}

export default SplitWrapper;
