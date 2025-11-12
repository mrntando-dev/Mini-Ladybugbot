const fs = require('fs');
const path = require('path');
const axios = require('axios');
const fetch = require('node-fetch');
const FileType = require('file-type');
const { fromBuffer } = require('file-type');

// Get buffer from URL
async function getBuffer(url, options = {}) {
    try {
        const res = await axios({
            method: "get",
            url,
            headers: {
                'DNT': 1,
                'Upgrade-Insecure-Request': 1
            },
            ...options,
            responseType: 'arraybuffer'
        });
        return res.data;
    } catch (err) {
        console.error('Error in getBuffer:', err.message);
        return err;
    }
}

// Fetch JSON
async function fetchJson(url, options = {}) {
    try {
        const res = await axios({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            },
            ...options
        });
        return res.data;
    } catch (err) {
        return err;
    }
}

// Runtime function
function runtime(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
}

// Sleep function
const sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// Format size
function formatSize(bytes) {
    if (bytes >= 1000000000) { bytes = (bytes / 1000000000).toFixed(2) + " GB"; }
    else if (bytes >= 1000000) { bytes = (bytes / 1000000).toFixed(2) + " MB"; }
    else if (bytes >= 1000) { bytes = (bytes / 1000).toFixed(2) + " KB"; }
    else if (bytes > 1) { bytes = bytes + " bytes"; }
    else if (bytes == 1) { bytes = bytes + " byte"; }
    else { bytes = "0 bytes"; }
    return bytes;
}

// Check if URL is valid
function isUrl(url) {
    const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlRegex.test(url);
}

module.exports = {
    getBuffer,
    fetchJson,
    runtime,
    sleep,
    formatSize,
    isUrl,
    fromBuffer
};
