// ── 簡單的測試框架 ────────────────────────────────────

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('\n🧪 開始執行測試...\n');
    
    for (const { name, fn } of this.tests) {
      try {
        await fn();
        this.passed++;
        console.log(`✅ ${name}`);
      } catch (error) {
        this.failed++;
        console.error(`❌ ${name}`);
        console.error(`   ${error.message}`);
      }
    }
    
    console.log(`\n📊 測試結果：${this.passed} 通過，${this.failed} 失敗，共 ${this.tests.length} 項`);
    
    if (this.failed > 0) {
      process.exit(1);
    }
  }
}

function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(
      message || `預期 ${expected}，實際得到 ${actual}`
    );
  }
}

function assertDeepEqual(actual, expected, message = '') {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(
      message || `預期 ${expectedStr}，實際得到 ${actualStr}`
    );
  }
}

function assertTrue(value, message = '') {
  if (!value) {
    throw new Error(message || `預期為 true`);
  }
}

function assertFalse(value, message = '') {
  if (value) {
    throw new Error(message || `預期為 false`);
  }
}

module.exports = {
  TestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse
};
