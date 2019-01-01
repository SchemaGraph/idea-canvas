import * as React from 'react';
import styled from 'styled-components';
import {
  H5,
  FormGroup,
  InputGroup,
  Button,
  Switch,
  MenuItem,
  Label,
  Icon,
  ButtonGroup,
  Divider,
  Slider,
} from '@blueprintjs/core';
import { Select, ItemRenderer, ItemPredicate } from '@blueprintjs/select';
import { colors } from '../theme/theme';
import { connect } from '../utils';
import { IStore } from '../store';
import { IContexts, IBox, IContext } from './models';
import { ContextIcon } from './context-list';
import { observer } from 'mobx-react';

interface Props {
  simulation: [boolean, (enabled: boolean) => void];
  circles: [boolean, (enabled: boolean) => void];
  N: [number, (enabled: number) => void];
}

const Container = styled.div``;

const AppPropertiesBase: React.FC<Props> & {
  defaultProps: Partial<Props>;
} = p => {
  function onChangeSwitch(key: 'simulation' | 'circles') {
    return () => p[key][1](!p[key][0]);
  }
  const { simulation, circles, N } = p;
  return (
    <Container>
      <Switch
        checked={simulation[0]}
        onChange={onChangeSwitch('simulation')}
        label="Simulation"
      />
      <Switch
        checked={circles[0]}
        onChange={onChangeSwitch('circles')}
        label="Circles"
      />
      <FormGroup label="N" labelFor="nodes">
        <Slider
          min={1}
          max={77}
          stepSize={1}
          labelStepSize={10}
          onChange={N[1]}
          value={N[0]}
        />
      </FormGroup>
    </Container>
  );
};
AppPropertiesBase.defaultProps = {
  simulation: [false, _b => {}],
};

export const AppProperties = connect<Props>((store, _) => ({
  simulation: [
    !!store.simulation,
    (enabled: boolean) => {
      if (enabled) {
        store.runSimulation();
      } else {
        store.discardSimulation();
      }
    },
  ],
  circles: [store.circles, store.useCircles],
  N: [store.numNodes, store.setNodeNumber],
}))(observer(AppPropertiesBase));
