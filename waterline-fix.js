/* eslint-disable no-undef */

// tymczasowe obejście waterline
// zmienić w module w pliku -> node_modules/waterline/lib/waterline/utils/query/proccess-all-records.js
// linijki od 526 ten if na ten kod niżej

if (WLModel.methods) {
  Object.assign(record, WLModel.methods)
}
