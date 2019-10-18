import React from "react";
import { Redirect, useParams } from "react-router-dom";
import * as api from "./api/appointmentApi";
import { toast } from "react-toastify";
import moment from 'moment-timezone';
import Heading from '@athena/forge/Heading';
import Form from '@athena/forge/Form';
import FormField from '@athena/forge/FormField';
import Button from '@athena/forge/Button';
import DateInput from '@athena/forge/DateInput';

const browserTime = moment.tz.guess();

const newAppointment = {
  id: null,
  day: '',
  time: '',
  appointmentType: '',
};

class DateError extends Error {}
class DayError extends Error {}
class TimeError extends Error {}

function getAppointmentDate(appointment) {
  if (!appointment.day && !appointment.time) {
    throw new DateError();
  }
  else if (!appointment.day) {
    throw new DayError();
  }
  if (!appointment.time) {
    throw new TimeError();
  }
  return moment.tz(`${appointment.day} ${appointment.time}`, browserTime).toDate();
}

export default function ManageAppointment(props) {
  // Handle state via the useState Hook
  const [appointment, setAppointment] = React.useState(newAppointment);
  const [errors, setErrors] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormSubmitted, setIsFormSubmitted] = React.useState(false);
  const [redirect, setRedirect] = React.useState(false);
  const { appointmentId, day } = useParams();
  React.useEffect(() => {
    // IOW, if editing.
    let mounted = true;
    if (appointmentId) {
      api.getAppointmentById(appointmentId).then(data => {
        if (mounted) {
          const date = moment.tz(data.date, browserTime);
          setAppointment({
            id: data.id,
            day: date.format('YYYY-MM-DD'),
            time: date.format('HH:mm'),
            appointmentType: data.appointmentType,
          });
          setIsLoading(false);
        }
      });
    }
    else if (day) {
      setAppointment({
        ...newAppointment,
        day,
      });
      setIsLoading(false);
    }
    else {
      // If adding, nothing to load
      setIsLoading(false);
    }

    // Called when component is unmounting.
    return () => (mounted = false);
  }, [appointmentId, day, setAppointment, setIsLoading]);

  const handleSave = React.useCallback((savedAppointment) => {
    const { appointmentType } = savedAppointment;
    const date = moment.tz(savedAppointment.date, browserTime);
    const day = date.format('ddd MMM Do');
    const time = date.format('HH:mm z');
    setRedirect(true);
    toast.success(`${appointmentType} appointment scheduled for ${day} at ${time} 🎉`);
  }, [setRedirect]);

  const handleCancel = React.useCallback(() => {
    setRedirect(true);
  }, [setRedirect]);

  const isValid = React.useCallback(() => {
    const err = {};
    if (!appointment.appointmentType) {
      err.appointmentType = 'appointment type is required';
    }
    try {
      const appointmentDate = getAppointmentDate(appointment);
      if (appointmentDate < new Date()) {
        err.day = 'appointment must be in the future';
        err.time = 'appointment must be in the future';
      }
    }
    catch (e) {
      if (e instanceof DateError) {
        err.day = 'appointment date is required';
        err.time = 'appointment time is required';
      }
      else if (e instanceof DayError) {
        err.day = 'appointment date is required';
      }
      else if (e instanceof TimeError) {
        err.time = 'appointment time is required';
      }
      else {
        err.day = e.message;
        err.time = e.message;
      }
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  }, [appointment]);

  const saveAppointment = React.useCallback((event) => {
    event.preventDefault(); // Don't post back
    if (!isValid()) {
      return;
    }
    setIsFormSubmitted(true);
    const data = {
      id: appointment.id,
      date: getAppointmentDate(appointment).toISOString(),
      appointmentType: appointment.appointmentType,
    };
    appointment.id
      ? api.editAppointment(data).then(handleSave)
      : api.addAppointment(data).then(handleSave);
  }, [isValid, appointment, handleSave]);

  const handleChange = React.useCallback((event) => {
    setAppointment({
      ...appointment,
      [event.target.name]: event.target.value,
    });
  }, [appointment, setAppointment]);

  const handleDayChange = React.useCallback((event) => {
    setAppointment({
      ...appointment,
      day: moment.tz(event.target.value, browserTime).format('YYYY-MM-DD'),
    });
  }, [appointment, setAppointment]);

  if (redirect) {
    const dayString = moment.tz(appointment.day, browserTime).format('YYYY-MM-DD');
    return <Redirect to={`/appointments/${dayString}`} />;
  }
  if (isLoading) return "Loading... 🦄";

  return (
    <>
      <Heading
        headingTag="h1"
        text={`${appointment.id ? 'Update' : 'Add'} Appointment`}
        variant="page"
      />
      <Form
        nested={false}
        onSubmit={saveAppointment}
        includeSubmitButton={false}
        requiredVariation="allFieldsRequired"
        className="appt-form"
      >
        <FormField
          id="appointment-type"
          labelText="Appointment Type"
          name="appointmentType"
          error={errors.appointmentType}
          onChange={handleChange}
          value={appointment.appointmentType}
          required
        />

        <FormField
          inputAs={DateInput}
          name="day"
          labelText="Appointment Date"
          type="day"
          id="appointment-date"
          error={errors.day}
          onChange={handleDayChange}
          value={moment.tz(appointment.day, browserTime).toDate()}
        />

        <FormField
          name="time"
          labelText="Appointment Time"
          type="time"
          id="appointment-time"
          error={errors.day}
          onChange={handleChange}
          value={appointment.time}
        />

        <div className="appt-form__action-bar">
          <Button
            className='appt-form__cancel'
            type='button'
            text='Cancel'
            onClick={handleCancel}
            variant='secondary'
          />

          <Button
            type="submit"
            disabled={isFormSubmitted}
            text={isFormSubmitted ? "Saving..." : "Save Appointment"}
          />
        </div>
      </Form>
    </>
  );
}
