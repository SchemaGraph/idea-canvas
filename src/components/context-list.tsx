import { observer } from 'mobx-react';
import * as React from 'react';
import styled from 'styled-components';
import { connect } from '../utils';
import { IContexts, IContext } from './models';
import { values } from 'mobx';
import { Tag, Icon } from '@blueprintjs/core';

const Container = styled.div`
  position: absolute;
  right: 0px;
  bottom: 0px;
  display: flex;
  flex-flow column;
  /* background-color: rgba(0, 0, 0, 0.2); */
`;
interface Props {
  contexts?: IContexts;
  remove?: (name: string) => void;
}
interface ItemProps {
  context: IContext;
}

const TTag = styled(Tag)`
  margin: 0 1px 1px 0;
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
        return (
          <TTag
            icon={<ContextIcon context={context} />}
            key={context.name}
            minimal
            onRemove={onRemove(context.name)}
          >
            {context.name}
          </TTag>
        );
      })}
    </Container>
  );
};

export const ContextList = connect<Props>(store => ({
  contexts: store.contexts,
  remove: store.removeContext,
}))(observer(ContextListVanilla));
