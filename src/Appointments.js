import React from 'react';
import { Link, Redirect, useParams } from "react-router-dom";
import Toast from '@athena/forge/Toast';
import DateInput  from '@athena/forge/DateInput';
import Button  from '@athena/forge/Button';
import Heading  from '@athena/forge/Heading';
import List  from '@athena/forge/List';
import ListItem  from '@athena/forge/ListItem';
import moment from 'moment-timezone';
import queryString from 'query-string';

import * as api from './api/appointmentApi';

const browserTime = moment.tz.guess();

function Appointment(props) {
  return (
    <ListItem key={props.id}>
      {moment.tz(props.date, browserTime).format('YYYY-MM-DD HH:mm z')}
      <br />
      <Link id={`appointment-${props.id}`} to={`/update-appointment/${props.id}`}>
        {props.appointmentType}
      </Link>
    </ListItem>
  );
}

function AppointmentList(props) {
  const { dayAppointments } = props;

  return !dayAppointments || dayAppointments.length === 0
  ? (
    <div className="schedule__no-upcoming">No upcoming appointments</div>
  )
  : ( <List
        className="fe_u_margin--top-medium"
        aria-labelledby="upcoming-appointments"
        dividers
      >
        {dayAppointments.sort(
          (a, b) => (a.date < b.date) ? -1 : a.date === b.date ? 0 : 1
        ).map(Appointment)}
      </List>
    )
}

export default function Appointments(props) {
  const [appointments, setAppointments] = React.useState([]);
  const params = useParams();
  const [day, setDay] = React.useState(
    params.day
      ? moment.tz(params.day, browserTime).toDate()
      : new Date()
  );
  const [redirect, setRedirect] = React.useState(false);
  React.useEffect(() => {
    api.getAppointments().then((data) => {
      setAppointments(data.map(appointment => ({
        ...appointment,
        moment: moment(appointment.date),
      })));
    });
  }, [setAppointments]);
  const addAppointment = React.useCallback(() => setRedirect(true), [setRedirect]);
  const dayAppointments = React.useMemo(() => {
    return appointments.filter(appointment => appointment.moment.isSame(day, 'day'));
  }, [day, appointments]);
  if (redirect) {
    const dayString = moment.tz(day, browserTime).format('YYYY-MM-DD');
    return <Redirect to={`/add-appointment/${dayString}`} />;
  }
  else {
    const values = queryString.parse(props.location.search);
    return (
      <>
        <Heading
          headingTag="h1"
          text="Appointments"
          variant="page"
        />
        <div className="schedule">

          <section className="fe_u_margin--top-large fe_u_margin--right-large">
            <DateInput
              onSelect={setDay}
              value={day}
              inline
            />
          </section>

          <section className="fe_u_margin--top-large">
            <Button
              onClick={addAppointment}
              text="Add Appointment"
            />
            <Heading
              id="upcoming-appointments"
              className="fe_u_margin--top-large"
              text="Schedule"
              headingTag="h2"
              variant="section"
            />
            <AppointmentList
              dayAppointments={dayAppointments}
            />
          </section>

        </div>

        {values.id &&
          <Toast
            id={values.id}
            headerText="Appointment Scheduled"
            alertType="success"
          >
            {values.type} scheduled for {values.date} at {values.time}
          </Toast>
        }

      </>
    );
  }
}
