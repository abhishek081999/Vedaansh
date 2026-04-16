const fs = require('fs');
const path = require('path');

const filePath = 'e:\\AstrologyProject\\jyotish-platform\\src\\app\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The problematic block contains "OLD_ACG" until "kp-stellar"
const startTag = "                 ) : activeTab === 'OLD_ACG' ? (";
const endTag = "                ) : activeTab === 'kp-stellar' ? (";

const startIndex = content.indexOf(startTag);
const endIndex = content.indexOf(endTag);

if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
    const newContent = content.substring(0, startIndex) + content.substring(endIndex);
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Successfully cleaned up the file.');
} else {
    console.log('Could not find the tags.', { startIndex, endIndex });
}
