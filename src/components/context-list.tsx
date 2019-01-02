import { observer } from 'mobx-react';
import * as React from 'react';
import styled from 'styled-components';
import { connect } from '../utils';
import { IContexts, IContext } from '../models/models';
import { values } from 'mobx';
import { Tag as BTag, Icon } from '@blueprintjs/core';
import Color from 'color';

const Container = styled.div`
  position: absolute;
  right: 1px;
  bottom: 1px;
  display: flex;
  flex-flow: column;
  /* background-color: rgba(0, 0, 0, 0.2); */
`;
interface Props {
  contexts?: IContexts;
  remove?: (name: string) => void;
}
const tagTextDecorations = ['none', 'line-through'];
const tagTextColors = [
  Color('#f5f8fa')
    .rgb()
    .string(),
  Color('#f5f8fa')
    .alpha(0.7)
    .rgb()
    .string(),
];
const Tag = styled(BTag)`
  margin: 0 1px 1px 0;
  &:focus {
    outline: none;
  }
`;

export const ContextIcon: React.SFC<{ context?: IContext }> = ({ context }) => (
  <Icon
    icon={context ? 'symbol-square' : 'symbol-circle'}
    color={context ? context.color : 'grey'}
    iconSize={20}
  />
);
const ContextListVanilla: React.SFC<Props> = ({ contexts, remove }) => {
  const onRemove = (name: string) => () => remove!(name);
  return (
    <Container>
      {values(contexts).map((context: IContext) => {
        const clickHandler = () => context.setVisible(!context.visible);
        return (
          <Tag
            icon={<ContextIcon context={context} />}
            key={context.name}
            onRemove={onRemove(context.name)}
            onClick={clickHandler}
            style={{
              color: tagTextColors[context.visible ? 0 : 1],
              textDecoration: tagTextDecorations[context.visible ? 0 : 1],
            }}
            interactive
            minimal
            large
          >
            {context.name}
          </Tag>
        );
      })}
    </Container>
  );
};

export const ContextList = connect<Props>(store => ({
  contexts: store.graph.contexts,
  remove: store.graph.removeContext,
}))(observer(ContextListVanilla));
