/**
 * Bộ lập lịch tự động cuối ngày (Timer Actor cho FR-13 & FR-14)
 * File: backend/jobs/scheduler.js
 */
const cron = require('node-cron');
const env = require('../config/env');
const maturityJobService = require('../services/admin/maturityJob.service');
const rolloverJobService = require('../services/admin/rolloverJob.service');

let started = false;

function startScheduler() {
    if (!env.cron.enabled || started) return;

    if (cron.validate(env.cron.maturitySchedule)) {
        cron.schedule(env.cron.maturitySchedule, async () => {
            try {
                const res = await maturityJobService.runMaturityReminderScan();
                console.log(`[CRON:FR-13] Quét đáo hạn: ${res.scannedCount} sổ, gửi thành công ${res.sentCount}`);
            } catch (err) {
                console.error('[CRON:FR-13_ERR]', err.message);
            }
        });
    }

    if (cron.validate(env.cron.rolloverSchedule)) {
        cron.schedule(env.cron.rolloverSchedule, async () => {
            try {
                const res = await rolloverJobService.runAutoRollover(1);
                console.log(`[CRON:FR-14] Tái tục tự động: ${res.rolledOverCount}/${res.dueCount} sổ`);
            } catch (err) {
                console.error('[CRON:FR-14_ERR]', err.message);
            }
        });
    }

    started = true;
    console.log(`⏰ Scheduler đã kích hoạt (FR-13: "${env.cron.maturitySchedule}", FR-14: "${env.cron.rolloverSchedule}")`);
}

module.exports = {
    startScheduler
};
