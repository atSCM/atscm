import ReconnectingEventSource from 'reconnecting-eventsource/src';
import { clientLog } from './lib/log';

// FIXME: Use path option onstead of '__reload__'
const events: EventSource = new ReconnectingEventSource(`/%%path%%/events`);
events.onmessage = (event) => {
  const parsedData = JSON.parse(event.data);

  clientLog.info('Received event', parsedData);
  if (parsedData.reload) {
    location.reload();
  }
};
