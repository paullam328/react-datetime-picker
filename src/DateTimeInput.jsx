import React, { Component } from 'react';
import PropTypes from 'prop-types';

import DayInput from 'react-date-picker/dist/DateInput/DayInput';
import MonthInput from 'react-date-picker/dist/DateInput/MonthInput';
import YearInput from 'react-date-picker/dist/DateInput/YearInput';
import HourInput from 'react-time-picker/dist/TimeInput/HourInput';
import MinuteInput from 'react-time-picker/dist/TimeInput/MinuteInput';
import SecondInput from 'react-time-picker/dist/TimeInput/SecondInput';
import Divider from './Divider';
import NativeInput from './DateTimeInput/NativeInput';

import { formatDate, formatTime } from './shared/dateFormatter';
import {
  getDay,
  getMonth,
  getYear,
  getHours,
  getMinutes,
  getSeconds,
} from './shared/dates';
import { isMaxDate, isMinDate } from './shared/propTypes';

const allViews = ['hour', 'minute', 'second'];
const className = 'react-datetime-picker__button__input';

const datesAreDifferent = (date1, date2) => (
  (date1 && !date2) ||
  (!date1 && date2) ||
  (date1 && date2 && date1.getTime() !== date2.getTime())
);

const findPreviousInput = (element) => {
  const previousElement = element.previousElementSibling; // Divider between inputs
  if (!previousElement) {
    return null;
  }
  return previousElement.previousElementSibling; // Actual input
};

const findNextInput = (element) => {
  const nextElement = element.nextElementSibling; // Divider between inputs
  if (!nextElement) {
    return null;
  }
  return nextElement.nextElementSibling; // Actual input
};

const selectIfPossible = (element) => {
  if (!element) {
    return;
  }
  element.focus();
  element.select();
};

const removeUnwantedCharacters = str => str
  .split('')
  .filter(a => (
    // We don't want spaces in dates
    a.charCodeAt(0) !== 32 &&
    // Internet Explorer specific
    a.charCodeAt(0) !== 8206
  ))
  .join('');

export default class DateTimeInput extends Component {
  state = {
    year: null,
    month: null,
    day: null,
    hour: null,
    minute: null,
    second: null,
  }

  componentWillMount() {
    this.updateValues();
  }

  componentWillReceiveProps(nextProps) {
    const { value: nextValue } = nextProps;
    const { value } = this.props;

    if (
      // Toggling clock visibility resets values
      (nextProps.isCalendarOpen !== this.props.isCalendarOpen) ||
      datesAreDifferent(nextValue, value)
    ) {
      this.updateValues(nextProps);
    }
  }

  /**
   * Returns value type that can be returned with currently applied settings.
   */
  get valueType() {
    const { maxDetail } = this.props;
    return maxDetail;
  }

  // eslint-disable-next-line class-methods-use-this
  get dateDivider() {
    const { locale } = this.props;
    const date = new Date(2017, 11, 11);

    return (
      removeUnwantedCharacters(formatDate(date, locale))
        .match(/[^0-9]/)[0]
    );
  }

  // eslint-disable-next-line class-methods-use-this
  get timeDivider() {
    const { locale } = this.props;
    const date = new Date(2017, 0, 1, 21, 12, 13);

    return (
      removeUnwantedCharacters(formatTime(date, locale))
        .match(/[^0-9]/)[0]
    );
  }

  // eslint-disable-next-line class-methods-use-this
  get datePlaceholder() {
    const { locale } = this.props;
    const date = new Date(2017, 11, 11);

    return (
      removeUnwantedCharacters(formatDate(date, locale))
        .replace('2017', 'year')
        .replace('12', 'month')
        .replace('11', 'day')
    );
  }

  // eslint-disable-next-line class-methods-use-this
  get timePlaceholder() {
    const { locale } = this.props;
    const date = new Date(2017, 0, 1, 21, 13, 14);

    return (
      removeUnwantedCharacters(formatTime(date, locale))
        .replace('21', 'hour-24')
        .replace('9', 'hour-12')
        .replace('13', 'minute')
        .replace('14', 'second')
        .replace(/AM|PM/, `${this.timeDivider}ampm`)
    );
  }

  get commonInputProps() {
    return {
      maxDate: this.props.maxDate,
      minDate: this.props.minDate,
      onChange: this.onChange,
      onKeyDown: this.onKeyDown,
      placeholder: '--',
      // This is only for showing validity when editing
      required: this.props.required || this.props.isCalendarOpen,
      itemRef: (ref) => {
        if (!ref) return;

        // Save a reference to each input field
        this[`${ref.name}Input`] = ref;
      },
    };
  }

  updateValues(props = this.props) {
    const { value } = props;

    this.setState({
      year: value ? getYear(value) : null,
      month: value ? getMonth(value) : null,
      day: value ? getDay(value) : null,
      hour: value ? getHours(value) : null,
      minute: value ? getMinutes(value) : null,
      second: value ? getSeconds(value) : null,
    });
  }

  onKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowLeft': {
        event.preventDefault();

        const input = event.target;
        const previousInput = findPreviousInput(input);
        selectIfPossible(previousInput);
        break;
      }
      case 'ArrowRight':
      case this.dateDivider:
      case this.timeDivider: {
        event.preventDefault();

        const input = event.target;
        const nextInput = findNextInput(input);
        selectIfPossible(nextInput);
        break;
      }
      default:
    }
  }

  /**
   * Called when non-native date input is changed.
   */
  onChange = (event) => {
    const { name, value } = event.target;

    this.setState(
      { [name]: value ? parseInt(value, 10) : null },
      this.onChangeExternal,
    );
  }

  /**
   * Called when native date input is changed.
   */
  onChangeNative = (event) => {
    const { value } = event.target;

    if (this.props.onChange) {
      this.props.onChange(value);
    }
  }

  /**
   * Called after internal onChange. Checks input validity. If all fields are valid,
   * calls props.onChange.
   */
  onChangeExternal = () => {
    if (this.props.onChange) {
      const formElements = [
        this.dayInput,
        this.monthInput,
        this.yearInput,
        this.hourInput,
        this.minuteInput,
        this.secondInput,
      ].filter(Boolean);

      const values = {};
      formElements.forEach((formElement) => {
        values[formElement.name] = formElement.value;
      });

      if (formElements.every(formElement => formElement.value && formElement.checkValidity())) {
        const proposedValue =
          new Date(
            values.year,
            (values.month || 1) - 1,
            values.day || 1,
            values.hour,
            values.minute || 0,
            values.second || 0,
          );
        const processedValue = proposedValue;
        this.props.onChange(processedValue, false);
      }
    }
  }

  renderDay() {
    return (
      <DayInput
        key="day"
        className={className}
        maxDetail={this.props.maxDetail}
        month={this.state.month}
        showLeadingZeros={this.props.showLeadingZeros}
        year={this.state.year}
        value={this.state.day}
        {...this.commonInputProps}
      />
    );
  }

  renderMonth() {
    return (
      <MonthInput
        key="month"
        className={className}
        maxDetail={this.props.maxDetail}
        minDate={this.props.minDate}
        showLeadingZeros={this.props.showLeadingZeros}
        value={this.state.month}
        {...this.commonInputProps}
      />
    );
  }

  renderYear() {
    return (
      <YearInput
        key="year"
        className={className}
        value={this.state.year}
        valueType="day"
        {...this.commonInputProps}
      />
    );
  }

  renderHour() {
    return (
      <HourInput
        key="hour"
        className={className}
        value={this.state.hour}
        {...this.commonInputProps}
      />
    );
  }

  renderMinute() {
    const { maxDetail } = this.props;

    // Do not display if maxDetail is "hour" or less
    if (allViews.indexOf(maxDetail) < 1) {
      return null;
    }

    return (
      <MinuteInput
        key="minute"
        className={className}
        maxDetail={this.props.maxDetail}
        value={this.state.minute}
        {...this.commonInputProps}
      />
    );
  }

  renderSecond() {
    const { maxDetail } = this.props;

    // Do not display if maxDetail is "minute" or less
    if (allViews.indexOf(maxDetail) < 2) {
      return null;
    }

    return (
      <SecondInput
        key="second"
        className={className}
        maxDetail={this.props.maxDetail}
        value={this.state.second}
        {...this.commonInputProps}
      />
    );
  }

  renderCustomDateInputs() {
    const { dateDivider, datePlaceholder } = this;

    return (
      datePlaceholder
        .split(dateDivider)
        .map((part) => {
          switch (part) {
            case 'day': return this.renderDay();
            case 'month': return this.renderMonth();
            case 'year': return this.renderYear();
            default: return null;
          }
        })
        .filter(Boolean)
        .reduce((result, element, index, array) => {
          result.push(element);

          if (index + 1 < array.length) {
            result.push(
              // eslint-disable-next-line react/no-array-index-key
              <Divider key={`separator_${index}`}>
                {dateDivider}
              </Divider>,
            );
          }

          return result;
        }, [])
    );
  }

  renderCustomTimeInputs() {
    const { timeDivider, timePlaceholder } = this;

    return (
      timePlaceholder
        .split(timeDivider)
        .map((part) => {
          switch (part) {
            case 'hour-24': return this.renderHour();
            case 'hour-12': return this.renderHour();
            case 'minute': return this.renderMinute();
            case 'second': return this.renderSecond();
            case 'ampm': return null; // TODO
            default: return null;
          }
        })
        .filter(Boolean)
        .reduce((result, element, index, array) => {
          result.push(element);

          if (index + 1 < array.length) {
            result.push(
              // eslint-disable-next-line react/no-array-index-key
              <Divider key={`separator_${index}`}>
                {timeDivider}
              </Divider>,
            );
          }

          return result;
        }, [])
    );
  }

  renderNativeInput() {
    return (
      <NativeInput
        key="time"
        maxDate={this.props.maxDate}
        minDate={this.props.minDate}
        name={this.props.name}
        onChange={this.onChangeNative}
        required={this.props.required}
        value={this.props.value}
        valueType={this.valueType}
      />
    );
  }

  render() {
    return (
      <div className={className}>
        {this.renderNativeInput()}
        {this.renderCustomDateInputs()}
        <Divider>
          {'\u00a0'}
        </Divider>
        {this.renderCustomTimeInputs()}
      </div>
    );
  }
}

DateTimeInput.defaultProps = {
  maxDetail: 'minute',
  name: 'datetime',
};

DateTimeInput.propTypes = {
  isCalendarOpen: PropTypes.bool,
  locale: PropTypes.string,
  maxDate: isMaxDate,
  maxDetail: PropTypes.oneOf(allViews),
  minDate: isMinDate,
  name: PropTypes.string,
  onChange: PropTypes.func,
  required: PropTypes.bool,
  showLeadingZeros: PropTypes.bool,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date),
  ]),
};
