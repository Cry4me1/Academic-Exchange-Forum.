const novel = require('novel');
console.log('Novel exports:', key => key, novel);
console.log('Type of novel:', typeof novel);
console.log('Keys:', Object.keys(novel));
if (novel.Editor) {
    console.log('Editor is present');
} else {
    console.log('Editor is MISSING');
}
if (novel.default) {
    console.log('novel.default is present:', typeof novel.default);
}
