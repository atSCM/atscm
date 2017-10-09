import ImportXmlStream from '../lib/server/ImportXmlStream';
import { src } from 'gulp';

/**
 * Imports all xml files needed for atscm usage.
 */
export default function importXml () {
  const srcStream = src('./node_modules/atscm/xml_resources/**/*.xml');

  return srcStream
    .pipe(new ImportXmlStream())
}

importXml.description = 'Imports all xml resources needed for atscm usage';