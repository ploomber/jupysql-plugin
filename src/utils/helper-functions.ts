/**
 * Convert special characters to their ASCII number values.
 * 
 * @param str Input string to be processed.
 * @returns Input string with special characters replaced with 
 *          their ASCII values.
 */
export const specialToASCII = (str: string): string => {
    let res = '';
    for(let i = 0; i < str.length; i++) {
        if(+str[i] || str[i].toLowerCase() !== str[i].toUpperCase()){
            res += str[i];
            continue;
        }
        else if (str[i] === ' ') {
            res += '_';
            continue;
        }
        res += str[i].charCodeAt(0);
    };
    return res;
 };