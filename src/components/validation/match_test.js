const isRobustMatch = (studentId, studentName, filename) => {
    const fn = filename.toLowerCase();
    const fnNums = fn.replace(/\D/g, '');
    const sId = studentId ? String(studentId).toLowerCase() : '';
    const sIdNums = sId.replace(/\D/g, '');
    const sName = studentName ? String(studentName).toLowerCase().trim() : '';

    if (sIdNums && fnNums && parseInt(fnNums, 10) === parseInt(sIdNums, 10)) return true;
    if (sId && sId !== 'undefined' && fn.includes(sId.replace(/\s+/g, ''))) return true;

    if (sName && sName.length > 2) {
      const normalizedFn = fn.replace(/[^a-z0-9]/g, '');
      const normalizedName = sName.replace(/[^a-z0-9]/g, '');
      if (normalizedFn.includes(normalizedName)) return true;
      const parts = sName.split(/\s+/);
      if (parts[0].length > 2 && normalizedFn.includes(parts[0].replace(/[^a-z0-9]/g, ''))) return true;
    }
    return false;
  };

console.log("Match 1:", isRobustMatch('1', 'Test', '1.jpg'));
console.log("Match 2:", isRobustMatch('', 'John Doe', 'john.jpg'));
console.log("Match 3:", isRobustMatch('undefined', 'Alice', '001_Alice.jpg'));
