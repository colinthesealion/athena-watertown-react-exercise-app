import React from "react";
import { Route, Switch } from "react-router-dom";
import Root from '@athena/forge/Root';
import ManageAppointment from './ManageAppointment';
import Appointments from './Appointments';

import './App.scss';
import leaf from './leaf.svg';

function App() {
  return (
    <Root className="ah_app">
      <header className="ah_app--header">
        <img src={leaf} alt="leaf logo" height="25" className="ah_app--logo"/>
      </header>
      <div className="ah_app--body">
        <aside className="ah_app--navigation"></aside>
        <main className="ah_app--main">
          <Switch>
            <Route path="/" exact component={Appointments} />
            <Route path="/appointments/:day" component={Appointments} />
            <Route path="/appointments" component={Appointments} />
            <Route path="/update-appointment/:appointmentId" component={ManageAppointment} />
            <Route path="/add-appointment/:day" component={ManageAppointment} />
          </Switch>
        </main>
      </div>
    </Root>
  );
}

export default App;
