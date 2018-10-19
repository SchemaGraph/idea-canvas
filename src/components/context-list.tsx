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
}
interface ItemProps {
  context: IContext;
}

const TTag = styled(Tag)`
  margin: 0 1px 1px 0;
`;

const ContextListVanilla: React.SFC<Props> = ({ contexts }) => {
  const onRemove = () => {};
  return (
    <Container>
        {values(contexts).map((context: IContext) => {
          const icon = <Icon icon="symbol-square" color={context.color} iconSize={20}/>
          return (
            <TTag icon={icon} key={context.name} minimal onRemove={onRemove}>
              {context.name}
            </TTag>
          );
        })}
    </Container>
  );
};

export const ContextList = connect<Props>(store => ({
  contexts: store.contexts as any,
}))(observer(ContextListVanilla));
