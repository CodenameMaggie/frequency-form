/**
 * Test Server Access API
 * Tests SSH and SMTP connection to root server (5.78.139.9)
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function handler(req, res) {
  console.log('[Server Access Test] Starting server connectivity tests...');

  const results = {
    server: '5.78.139.9',
    timestamp: new Date().toISOString(),
    tests: {}
  };

  try {
    // Test 1: SSH Key Check
    console.log('[Test 1] Checking SSH key...');
    try {
      const { stdout: keyCheck } = await execAsync('ssh-add -l');
      results.tests.ssh_key = {
        status: 'success',
        message: 'SSH key loaded in agent',
        details: keyCheck.trim()
      };
    } catch (error) {
      results.tests.ssh_key = {
        status: 'failed',
        message: 'No SSH key in agent',
        error: error.message
      };
    }

    // Test 2: SSH Connection Test (non-interactive)
    console.log('[Test 2] Testing SSH connection...');
    try {
      const { stdout: sshTest } = await execAsync(
        'ssh -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@5.78.139.9 "hostname" 2>&1',
        { timeout: 15000 }
      );
      results.tests.ssh_connection = {
        status: 'success',
        message: 'SSH connection successful',
        hostname: sshTest.trim()
      };
    } catch (error) {
      results.tests.ssh_connection = {
        status: 'failed',
        message: 'SSH connection failed',
        error: error.message
      };
    }

    // Test 3: Port 25 Connectivity
    console.log('[Test 3] Testing SMTP port 25...');
    try {
      const { stdout: portTest } = await execAsync(
        'nc -zv -w 5 5.78.139.9 25 2>&1',
        { timeout: 10000 }
      );
      results.tests.port_25 = {
        status: 'success',
        message: 'Port 25 is open',
        details: portTest.trim()
      };
    } catch (error) {
      results.tests.port_25 = {
        status: 'failed',
        message: 'Port 25 connection failed',
        error: error.message
      };
    }

    // Test 4: SMTP Connection via Nodemailer
    console.log('[Test 4] Testing SMTP with nodemailer...');
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: '5.78.139.9',
        port: 25,
        secure: false,
        auth: undefined,
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000
      });

      await transporter.verify();
      results.tests.smtp_nodemailer = {
        status: 'success',
        message: 'SMTP connection verified'
      };
    } catch (error) {
      results.tests.smtp_nodemailer = {
        status: 'failed',
        message: 'SMTP connection failed',
        error: error.message
      };
    }

    // Test 5: Check if running from Railway
    const isRailway = !!process.env.RAILWAY_ENVIRONMENT;
    results.environment = {
      platform: isRailway ? 'Railway' : 'Local',
      railway_env: process.env.RAILWAY_ENVIRONMENT || 'N/A',
      public_domain: process.env.RAILWAY_PUBLIC_DOMAIN || 'N/A'
    };

    // Summary
    const totalTests = Object.keys(results.tests).length;
    const passedTests = Object.values(results.tests).filter(t => t.status === 'success').length;

    results.summary = {
      total: totalTests,
      passed: passedTests,
      failed: totalTests - passedTests,
      success_rate: `${Math.round((passedTests / totalTests) * 100)}%`
    };

    console.log('[Server Access Test] Complete:', results.summary);

    return res.status(200).json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('[Server Access Test] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      results: results
    });
  }
}

module.exports = handler;
