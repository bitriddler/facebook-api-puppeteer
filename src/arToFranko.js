module.exports = (text) => {
  const arMap = ['ض','ص','ث','ق','ف','غ','ع','ه','خ','ح','ج','ة','ش' ,'س','ي','ب','ل','ا','ت','ن','م','ك','ظ','ط','ذ','د','ز','ر','و','ٌإ', '؟', 'ء'];
  const frMap = ['d','s','s','q','f','8','3','h','5','7','g','h','sh','s','y','b','l','a','t','n','m','k','z','t','z','d','z','r','w','e', '?', '2'];

  return text
    .split('')
    .map((char) => {
      const index = arMap.indexOf(char);
      return index > -1 ? frMap[index] : char;
    })
    .join('');
};
