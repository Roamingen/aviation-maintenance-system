const { contract } = require('./config');
const { ethers } = require("ethers");

async function main() {
    // 获取所有记录ID
    const count = await contract.getRecordCount();
    console.log("Total records:", count.toString());

    if (count > 0n) {
        // 获取最新的一个记录
        const ids = await contract.getRecordIdsByPage(1, 1);
        const id = ids[0];
        console.log("Fetching record:", id);

        const record = await contract.getRecordById(id);
        console.log("Raw Record:", record);
        
        console.log("Signatures:", record.signatures);
        console.log("PeerChecks:", record.signatures.peerChecks);
        
        if (record.signatures.peerChecks.length > 0) {
             console.log("First PeerCheck:", record.signatures.peerChecks[0]);
             // Check if it has toObject
             console.log("Has toObject:", typeof record.signatures.peerChecks[0].toObject);
        }

        const formatted = convertBigIntToString(record);
        console.log("Formatted:", JSON.stringify(formatted, null, 2));
    }
}

function convertBigIntToString(obj) {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'bigint') {
        return obj.toString();
    }
    
    // Ethers v6 Result object
    if (typeof obj.toObject === 'function') {
        try {
            return convertBigIntToString(obj.toObject());
        } catch (e) {
            console.warn("Failed to convert Result to object:", e);
        }
    }
    
    if (Array.isArray(obj)) {
        return obj.map(convertBigIntToString);
    }
    
    if (typeof obj === 'object') {
        const newObj = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                newObj[key] = convertBigIntToString(obj[key]);
            }
        }
        return newObj;
    }
    
    return obj;
}

main().catch(console.error);
