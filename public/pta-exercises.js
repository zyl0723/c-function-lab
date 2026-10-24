// 借鉴/改编自作者自己的 PTA C 代码体检项目。题目文本、测试与参考解为本站重新编写。
const ptaLab = (data) => ({
  difficulty: '中等',
  origin: '原创题，借鉴 pta-c-checker 的常见错误场景',
  targetMinutes: 20,
  ...data
});

export const ptaExercises = [
  ptaLab({
    id: 'fn-string-length',
    title: '动手写：读取一行并求长度',
    moduleId: 'string-core',
    track: 'fgets + strcspn + strlen',
    tier: '单点应用',
    level: 1,
    minutes: 12,
    functions: ['fgets', 'strcspn', 'strlen'],
    summary: '读取可能含空格的一整行，去掉行尾后输出长度。',
    prompt: '输入一行不超过 500 字符的文本。输出不包含行尾换行符的字符数。文本中可以包含空格。',
    requirements: ['用 fgets 读取整行', '去掉行尾的换行符', '用 strlen 计算长度'],
    starter: String.raw`#include <stdio.h>
#include <string.h>

int main(void) {
    char line[512];
    /* TODO: 读取一行，去掉行尾，输出 strlen。 */
    return 0;
}
`,
    tests: [
      { name: '普通文本', input: 'hello\n', expected: '5' },
      { name: '包含空格', input: 'a b c\n', expected: '5' },
      { name: '空行', input: '\n', expected: '0' }
    ],
    hints: ['fgets 会把换行符保留在缓冲区里。', 'strcspn(line, "\\r\\n") 可定位行尾。'],
    solution: String.raw`#include <stdio.h>
#include <string.h>

int main(void) {
    char line[512];
    if (!fgets(line, sizeof line, stdin)) return 0;
    line[strcspn(line, "\r\n")] = '\0';
    printf("%zu\n", strlen(line));
    return 0;
}
`
  }),
  ptaLab({
    id: 'fn-ctype-normalize',
    title: '动手写：字符分类与规范化',
    moduleId: 'ctype',
    track: 'isspace + toupper',
    tier: '单点应用',
    level: 1,
    minutes: 15,
    functions: ['fgets', 'isspace', 'toupper'],
    summary: '读取一行，删除所有空白，把字母转为大写，保留其他可见字符。',
    prompt: '输入一行文本。输出删除空白后的结果，其中字母统一转换为大写。不要输出额外提示。',
    requirements: ['使用 isspace 跳过所有空白', '使用 toupper 转换字母', '保留数字和标点'],
    starter: String.raw`#include <ctype.h>
#include <stdio.h>

int main(void) {
    char line[512];
    if (!fgets(line, sizeof line, stdin)) return 0;

    /* TODO: 逐字符过滤并输出。 */
    return 0;
}
`,
    tests: [
      { name: '混合文本', input: 'C is fun 42!\n', expected: 'CISFUN42!' },
      { name: '已有大写', input: 'abc XYZ\n', expected: 'ABCXYZ' },
      { name: '全是空白', input: '  \t \n', expected: '' }
    ],
    hints: ['isspace 也会识别换行和制表符。', 'toupper 返回转换后的 int，需要转换成 char 再输出。'],
    solution: String.raw`#include <ctype.h>
#include <stdio.h>

int main(void) {
    char line[512];
    if (!fgets(line, sizeof line, stdin)) return 0;
    for (size_t i = 0; line[i] != '\0'; i++) {
        unsigned char ch = (unsigned char)line[i];
        if (!isspace(ch)) putchar(toupper(ch));
    }
    return 0;
}
`
  }),
  ptaLab({
    id: 'fn-math-circle',
    title: '动手写：圆的面积与周长',
    moduleId: 'math-numeric',
    track: 'math.h + 格式化输出',
    tier: '单点应用',
    level: 2,
    minutes: 15,
    functions: ['acos', 'pow', 'printf'],
    summary: '根据半径计算圆面积与周长，保留两位小数。',
    prompt: '输入一个非负浮点数 r。输出 area=<面积> circumference=<周长>，均保留两位小数。π 用 acos(-1.0) 获得。',
    requirements: ['使用 acos(-1.0) 得到 π', '面积公式为 πr²', '周长公式为 2πr'],
    starter: String.raw`#include <math.h>
#include <stdio.h>

int main(void) {
    double r;
    if (scanf("%lf", &r) != 1 || r < 0) return 0;
    /* TODO: 计算并输出。 */
    return 0;
}
`,
    tests: [
      { name: '半径 1', input: '1\n', expected: 'area=3.14 circumference=6.28' },
      { name: '半径 2.5', input: '2.5\n', expected: 'area=19.63 circumference=15.71' },
      { name: '半径 0', input: '0\n', expected: 'area=0.00 circumference=0.00' }
    ],
    hints: ['π 可以写成 double pi = acos(-1.0);', '按题目顺序输出，并用 %.2f。'],
    solution: String.raw`#include <math.h>
#include <stdio.h>

int main(void) {
    double r;
    if (scanf("%lf", &r) != 1 || r < 0) return 0;
    double pi = acos(-1.0);
    printf("area=%.2f circumference=%.2f\n", pi * r * r, 2.0 * pi * r);
    return 0;
}
`
  }),
  ptaLab({
    id: 'fn-qsort-three',
    title: '动手写：qsort 排序三个整数',
    moduleId: 'stdlib-core',
    track: 'qsort + 比较器',
    tier: '单点应用',
    level: 2,
    minutes: 18,
    functions: ['qsort'],
    summary: '使用 qsort 把三个整数按升序输出。',
    prompt: '输入三个整数。使用 qsort 排序后，以空格分隔输出。不要在 main 中手写三段比较交换。',
    requirements: ['使用 qsort', '比较器返回整数三态', '输出末尾不要多空格'],
    starter: String.raw`#include <stdio.h>
#include <stdlib.h>

int compare_int(const void *a, const void *b) {
    /* TODO */
    return 0;
}

int main(void) {
    int values[3];
    if (scanf("%d %d %d", &values[0], &values[1], &values[2]) != 3) return 0;
    /* TODO: qsort 后输出。 */
    return 0;
}
`,
    tests: [
      { name: '乱序', input: '9 2 5\n', expected: '2 5 9' },
      { name: '含负数', input: '-1 -8 3\n', expected: '-8 -1 3' },
      { name: '已经有序', input: '1 2 3\n', expected: '1 2 3' }
    ],
    hints: ['比较器参数先转换成 const int *。', '避免用 a-b 作为比较结果。'],
    solution: String.raw`#include <stdio.h>
#include <stdlib.h>

int compare_int(const void *a, const void *b) {
    int x = *(const int *)a;
    int y = *(const int *)b;
    return (x > y) - (x < y);
}

int main(void) {
    int values[3];
    if (scanf("%d %d %d", &values[0], &values[1], &values[2]) != 3) return 0;
    qsort(values, 3, sizeof values[0], compare_int);
    printf("%d %d %d\n", values[0], values[1], values[2]);
    return 0;
}
`
  }),
  ptaLab({
    id: 'pta-scanf-address',
    title: '修 Bug：scanf 忘了取地址符',
    moduleId: 'stdio-core',
    track: 'scanf 参数错误',
    tier: 'PTA 错因修复',
    level: 1,
    minutes: 10,
    functions: ['scanf', 'printf'],
    origin: '改编自 pta-c-checker 规则 R01（原项目测试场景）',
    ruleCodes: ['R01'],
    summary: '修复输入崩溃：scanf 的 int 参数必须传地址。',
    prompt: '下面程序本应读取两个整数并输出它们的和。请修复错误，不要改变输入输出格式。',
    requirements: ['保留 scanf 格式串', '修复取地址符', '输出两数之和'],
    starter: String.raw`#include <stdio.h>

int main(void) {
    int a, b;
    if (scanf("%d %d", a, b) != 2) return 0;
    printf("%d\n", a + b);
    return 0;
}
`,
    tests: [
      { name: '正数', input: '2 3\n', expected: '5' },
      { name: '一正一负', input: '-7 2\n', expected: '-5' },
      { name: '较大整数', input: '100 200\n', expected: '300' }
    ],
    hints: ['scanf 需要知道把结果写到哪里。', '检查两个参数是否都传入地址。'],
    solution: String.raw`#include <stdio.h>

int main(void) {
    int a, b;
    if (scanf("%d %d", &a, &b) != 2) return 0;
    printf("%d\n", a + b);
    return 0;
}
`
  }),
  ptaLab({
    id: 'pta-math-include',
    title: '修 Bug：sqrt 缺少头文件',
    moduleId: 'math-numeric',
    track: 'math.h 声明缺失',
    tier: 'PTA 错因修复',
    level: 1,
    minutes: 10,
    functions: ['sqrt'],
    origin: '改编自 pta-c-checker 规则 C05（原项目测试场景）',
    ruleCodes: ['C05'],
    summary: '补上 math.h，让 sqrt 调用拥有正确声明。',
    prompt: '读取一个非负浮点数，输出其平方根，保留三位小数。修复缺失的 include。',
    requirements: ['补上正确的头文件', '使用 sqrt', '输出保留三位小数'],
    starter: String.raw`#include <stdio.h>

int main(void) {
    double x;
    if (scanf("%lf", &x) != 1 || x < 0) return 0;
    printf("%.3f\n", sqrt(x));
    return 0;
}
`,
    tests: [
      { name: '完全平方数', input: '9\n', expected: '3.000' },
      { name: '小数', input: '2\n', expected: '1.414' },
      { name: '零', input: '0\n', expected: '0.000' }
    ],
    hints: ['sqrt 属于 math.h。', '不要忘记检查输入非负。'],
    solution: String.raw`#include <math.h>
#include <stdio.h>

int main(void) {
    double x;
    if (scanf("%lf", &x) != 1 || x < 0) return 0;
    printf("%.3f\n", sqrt(x));
    return 0;
}
`
  }),
  ptaLab({
    id: 'pta-puts-newline',
    title: '修 Bug：puts 多输出一个换行',
    moduleId: 'stdio-core',
    track: 'PTA 格式错误',
    tier: 'PTA 错因修复',
    level: 1,
    minutes: 8,
    functions: ['puts'],
    origin: '改编自 pta-c-checker 规则 F01（原项目测试场景）',
    ruleCodes: ['F01'],
    summary: 'puts 会自动补换行，字符串里不要再写一次。',
    prompt: '程序应只输出一行 OK。修复多余的换行，不要改用 printf。',
    requirements: ['仍然使用 puts', '最终 stdout 恰好为一行 OK', '不要输出其他内容'],
    starter: String.raw`#include <stdio.h>

int main(void) {
    puts("OK\n");
    return 0;
}
`,
    tests: [
      { name: '恰好一行', input: '', expected: 'OK' }
    ],
    hints: ['puts 会在字符串末尾自动追加换行。'],
    solution: String.raw`#include <stdio.h>

int main(void) {
    puts("OK");
    return 0;
}
`
  }),
  ptaLab({
    id: 'pta-fullwidth-punctuation',
    title: '修 Bug：全角分号导致编译失败',
    moduleId: 'ctype',
    track: '全角字符 / 编译错误',
    tier: 'PTA 错因修复',
    level: 1,
    minutes: 8,
    functions: ['printf'],
    origin: '改编自 pta-c-checker 规则 C01（原项目测试场景）',
    ruleCodes: ['C01'],
    summary: '识别中文输入法留下的全角分号，并把它改成半角。',
    prompt: '下面的程序因一个全角分号无法编译。修复它，读取整数并输出它的两倍。',
    requirements: ['找出并修复全角符号', '保持计算结果正确', '不要在输出中加入中文提示'],
    starter: String.raw`#include <stdio.h>

int main(void) {
    int value；
    if (scanf("%d", &value) != 1) return 0;
    printf("%d\n", value * 2);
    return 0;
}
`,
    tests: [
      { name: '普通整数', input: '3\n', expected: '6' },
      { name: '负数', input: '-5\n', expected: '-10' }
    ],
    hints: ['全角分号看起来像中文标点，不是 C 语法的一部分。'],
    solution: String.raw`#include <stdio.h>

int main(void) {
    int value;
    if (scanf("%d", &value) != 1) return 0;
    printf("%d\n", value * 2);
    return 0;
}
`
  }),
  ptaLab({
    id: 'pta-int-division',
    title: '修 Bug：整数除法丢失小数',
    moduleId: 'math-numeric',
    track: '整数除法 / 类型转换',
    tier: 'PTA 错因修复',
    level: 2,
    minutes: 12,
    functions: ['printf'],
    origin: '改编自 pta-c-checker 规则 L01（原项目测试场景）',
    ruleCodes: ['L01'],
    summary: '把整数和转换为 double，再做除法。',
    prompt: '读取 n 个整数，输出它们的平均值，保留两位小数。修复整数除法导致的小数丢失。',
    requirements: ['平均值保留两位小数', '不要使用整数除法作为最后一步', '保留输入 0 个数的保护'],
    starter: String.raw`#include <stdio.h>

int main(void) {
    int n, x, sum = 0;
    if (scanf("%d", &n) != 1 || n <= 0) return 0;
    for (int i = 0; i < n; i++) {
        if (scanf("%d", &x) != 1) return 0;
        sum += x;
    }
    double average = sum / n;
    printf("%.2f\n", average);
    return 0;
}
`,
    tests: [
      { name: '不能整除', input: '3\n1 2 2\n', expected: '1.67' },
      { name: '平均数为整数', input: '2\n4 6\n', expected: '5.00' },
      { name: '含负数', input: '3\n-2 0 2\n', expected: '0.00' }
    ],
    hints: ['sum / n 的两个操作数都是 int。', '可以先转换 sum，再除以 n。'],
    solution: String.raw`#include <stdio.h>

int main(void) {
    int n, x, sum = 0;
    if (scanf("%d", &n) != 1 || n <= 0) return 0;
    for (int i = 0; i < n; i++) {
        if (scanf("%d", &x) != 1) return 0;
        sum += x;
    }
    double average = (double)sum / n;
    printf("%.2f\n", average);
    return 0;
}
`
  }),
  ptaLab({
    id: 'pta-string-compare',
    title: '修 Bug：字符串不能用 == 比较内容',
    moduleId: 'string-core',
    track: 'strcmp / 指针比较',
    tier: 'PTA 错因修复',
    level: 2,
    minutes: 12,
    functions: ['strcmp', 'scanf'],
    origin: '改编自 pta-c-checker 规则 L03（原项目测试场景）',
    ruleCodes: ['L03'],
    summary: '把数组名之间的 == 改成 strcmp。',
    prompt: '读取两个不含空格的单词。相同输出 SAME，不同输出 DIFFERENT。修复字符串比较。',
    requirements: ['使用 strcmp', '不要比较数组地址', '输出区分大小写'],
    starter: String.raw`#include <stdio.h>
#include <string.h>

int main(void) {
    char a[64], b[64];
    if (scanf("%63s %63s", a, b) != 2) return 0;
    if (a == b) puts("SAME");
    else puts("DIFFERENT");
    return 0;
}
`,
    tests: [
      { name: '相同内容', input: 'hello hello\n', expected: 'SAME' },
      { name: '不同内容', input: 'hello world\n', expected: 'DIFFERENT' },
      { name: '大小写不同', input: 'C c\n', expected: 'DIFFERENT' }
    ],
    hints: ['数组名在表达式中会退化为首元素地址。', 'strcmp 返回 0 表示内容相同。'],
    solution: String.raw`#include <stdio.h>
#include <string.h>

int main(void) {
    char a[64], b[64];
    if (scanf("%63s %63s", a, b) != 2) return 0;
    if (strcmp(a, b) == 0) puts("SAME");
    else puts("DIFFERENT");
    return 0;
}
`
  }),
  ptaLab({
    id: 'pta-loop-bound',
    title: '修 Bug：数组循环边界越界',
    moduleId: 'stdlib-core',
    track: '数组边界 / 循环条件',
    tier: 'PTA 错因修复',
    level: 2,
    minutes: 12,
    functions: ['printf'],
    origin: '改编自 pta-c-checker 规则 L05（原项目测试场景）',
    ruleCodes: ['L05'],
    summary: '找出循环多跑一轮造成的数组越界。',
    prompt: '读取 5 个整数并输出总和。修复循环边界，不要改变数组大小。',
    requirements: ['数组下标必须留在 0–4', '读取恰好 5 个整数', '输出总和'],
    starter: String.raw`#include <stdio.h>

int main(void) {
    int values[5];
    int sum = 0;
    for (int i = 0; i < 5; i++) {
        if (scanf("%d", &values[i]) != 1) return 0;
    }
    for (int i = 0; i <= 5; i++) {
        sum += values[i];
    }
    printf("%d\n", sum);
    return 0;
}
`,
    tests: [
      { name: '普通值', input: '1 2 3 4 5\n', expected: '15' },
      { name: '含负数', input: '-1 -2 -3 -4 -5\n', expected: '-15' },
      { name: '全零', input: '0 0 0 0 0\n', expected: '0' }
    ],
    hints: ['合法下标是 0、1、2、3、4。', '条件 i <= 5 会让 i 等于 5。'],
    solution: String.raw`#include <stdio.h>

int main(void) {
    int values[5];
    int sum = 0;
    for (int i = 0; i < 5; i++) {
        if (scanf("%d", &values[i]) != 1) return 0;
    }
    for (int i = 0; i < 5; i++) {
        sum += values[i];
    }
    printf("%d\n", sum);
    return 0;
}
`
  }),
  ptaLab({
    id: 'pta-init-sum',
    title: '修 Bug：累加变量没有初始化',
    moduleId: 'stdlib-core',
    track: '局部变量初始化',
    tier: 'PTA 错因修复',
    level: 2,
    minutes: 10,
    functions: ['scanf', 'printf'],
    origin: '改编自 pta-c-checker 规则 L04（原项目测试场景）',
    ruleCodes: ['L04'],
    summary: '累加前把 sum 明确初始化为 0。',
    prompt: '读取 n 个整数并输出总和。修复未初始化就累加的局部变量。',
    requirements: ['变量先初始化再使用', '处理正数和负数', '输出只包含总和'],
    starter: String.raw`#include <stdio.h>

int main(void) {
    int n, x;
    int sum;
    if (scanf("%d", &n) != 1) return 0;
    for (int i = 0; i < n; i++) {
        if (scanf("%d", &x) != 1) return 0;
        sum += x;
    }
    printf("%d\n", sum);
    return 0;
}
`,
    tests: [
      { name: '普通累加', input: '4\n1 2 3 4\n', expected: '10' },
      { name: '含负数', input: '3\n-5 2 1\n', expected: '-2' },
      { name: '没有元素', input: '0\n', expected: '0' }
    ],
    hints: ['局部自动变量不会自动为 0。', 'sum = 0 应该在循环前完成。'],
    solution: String.raw`#include <stdio.h>

int main(void) {
    int n, x;
    int sum = 0;
    if (scanf("%d", &n) != 1) return 0;
    for (int i = 0; i < n; i++) {
        if (scanf("%d", &x) != 1) return 0;
        sum += x;
    }
    printf("%d\n", sum);
    return 0;
}
`
  }),
  ptaLab({
    id: 'pta-char-newline',
    title: '修 Bug：%c 读到残留换行',
    moduleId: 'stdio-core',
    track: 'scanf 空白处理',
    tier: 'PTA 错因修复',
    level: 2,
    minutes: 12,
    functions: ['scanf', 'printf'],
    origin: '改编自 pta-c-checker 规则 R08（原项目测试场景）',
    ruleCodes: ['R08'],
    summary: '在 %c 前加一个空格，跳过上一次输入留下的空白。',
    prompt: '先读一个整数 n，再读一个非空白字符 ch。输出 n=<n> ch=<ch>。修复 %c 读到换行的问题。',
    requirements: ['保持读取顺序', '用 scanf 读字符', '输出格式固定'],
    starter: String.raw`#include <stdio.h>

int main(void) {
    int n;
    char ch;
    if (scanf("%d", &n) != 1) return 0;
    if (scanf("%c", &ch) != 1) return 0;
    printf("n=%d ch=%c\n", n, ch);
    return 0;
}
`,
    tests: [
      { name: '换行后读字符', input: '65\nZ\n', expected: 'n=65 ch=Z' },
      { name: '空格后读字符', input: '7   #\n', expected: 'n=7 ch=#' }
    ],
    hints: ['%c 不会自动跳过空白。', '格式串 "%c" 前加空格可以跳过前导空白。'],
    solution: String.raw`#include <stdio.h>

int main(void) {
    int n;
    char ch;
    if (scanf("%d", &n) != 1) return 0;
    if (scanf(" %c", &ch) != 1) return 0;
    printf("n=%d ch=%c\n", n, ch);
    return 0;
}
`
  }),
  ptaLab({
    id: 'pta-format-decimals',
    title: '修 Bug：输出小数位数不对',
    moduleId: 'stdio-core',
    track: 'printf 格式精度',
    tier: 'PTA 错因修复',
    level: 2,
    minutes: 10,
    functions: ['printf'],
    origin: '改编自 pta-c-checker 规则 F03（原项目测试场景）',
    ruleCodes: ['F03'],
    summary: '题目要求两位小数时必须使用 %.2f。',
    prompt: '读取两个整数，输出它们的平均值，严格保留两位小数。修复格式说明。',
    requirements: ['平均值按浮点计算', '输出恰好两位小数', '不要输出提示文字'],
    starter: String.raw`#include <stdio.h>

int main(void) {
    int a, b;
    if (scanf("%d %d", &a, &b) != 2) return 0;
    double average = (a + b) / 2.0;
    printf("%f\n", average);
    return 0;
}
`,
    tests: [
      { name: '结果为五位小数', input: '1 2\n', expected: '1.50' },
      { name: '结果为整数', input: '4 6\n', expected: '5.00' },
      { name: '负数', input: '-3 -2\n', expected: '-2.50' }
    ],
    hints: ['%f 默认通常输出六位小数。', '精度写在 % 和 f 之间。'],
    solution: String.raw`#include <stdio.h>

int main(void) {
    int a, b;
    if (scanf("%d %d", &a, &b) != 2) return 0;
    double average = (a + b) / 2.0;
    printf("%.2f\n", average);
    return 0;
}
`
  }),
  ptaLab({
    id: 'pta-scanf-double',
    title: '修 Bug：double 误用 %f 读入',
    moduleId: 'stdio-core',
    track: 'scanf 类型匹配',
    tier: 'PTA 错因修复',
    level: 2,
    minutes: 10,
    functions: ['scanf', 'printf'],
    origin: '改编自 pta-c-checker 规则 R03（原项目测试场景）',
    ruleCodes: ['R03'],
    summary: 'scanf 读取 double 必须使用 %lf。',
    prompt: '读取一个 double，输出它的两倍，保留两位小数。修复 scanf 格式符。',
    requirements: ['scanf 使用正确的 double 格式符', '输出两位小数', '变量类型保持不变'],
    starter: String.raw`#include <stdio.h>

int main(void) {
    double x;
    if (scanf("%f", &x) != 1) return 0;
    printf("%.2f\n", x * 2.0);
    return 0;
}
`,
    tests: [
      { name: '普通小数', input: '2.5\n', expected: '5.00' },
      { name: '负数', input: '-1.25\n', expected: '-2.50' },
      { name: '整数输入', input: '3\n', expected: '6.00' }
    ],
    hints: ['printf 的 double 用 %f。', 'scanf 的 double 用 %lf。'],
    solution: String.raw`#include <stdio.h>

int main(void) {
    double x;
    if (scanf("%lf", &x) != 1) return 0;
    printf("%.2f\n", x * 2.0);
    return 0;
}
`
  }),
  ptaLab({
    id: 'pta-multi-case',
    title: '修 Bug：多组输入只处理了一组',
    moduleId: 'stdio-core',
    track: 'EOF 循环',
    tier: 'PTA 错因修复',
    level: 3,
    minutes: 15,
    functions: ['scanf', 'printf'],
    origin: '改编自 pta-c-checker 规则 P01（原项目测试场景）',
    ruleCodes: ['P01'],
    summary: '题目要求读到 EOF 时，必须用循环处理每一组数据。',
    prompt: '输入包含多组数据，每组两个整数，直到文件末尾。每组输出两数之和，一行一个结果。',
    requirements: ['循环读取到 EOF', '每组输出一行', '不能只处理第一组'],
    starter: String.raw`#include <stdio.h>

int main(void) {
    int a, b;
    if (scanf("%d %d", &a, &b) != 2) return 0;
    printf("%d\n", a + b);
    return 0;
}
`,
    tests: [
      { name: '两组数据', input: '1 2\n3 4\n', expected: '3\n7' },
      { name: '三组数据', input: '-1 1\n10 20\n5 -8\n', expected: '0\n30\n-3' }
    ],
    hints: ['检查 scanf 返回值是否仍然等于 2。', '循环里完成输入和输出。'],
    solution: String.raw`#include <stdio.h>

int main(void) {
    int a, b;
    while (scanf("%d %d", &a, &b) == 2) {
        printf("%d\n", a + b);
    }
    return 0;
}
`
  }),
  ptaLab({
    id: 'pta-read-spaces',
    title: '修 Bug：scanf %s 读不到空格',
    moduleId: 'stdio-core',
    track: 'fgets / 整行读取',
    tier: 'PTA 错因修复',
    level: 3,
    minutes: 15,
    functions: ['fgets', 'strcspn', 'puts'],
    origin: '改编自 pta-c-checker 规则 P02（原项目测试场景）',
    ruleCodes: ['P02'],
    summary: '题目说“一行字符串”时，scanf %s 会在第一个空白处停下。',
    prompt: '输入一行可能包含空格的文本。原样输出整行，不包含行尾换行。',
    requirements: ['用 fgets 读取整行', '去掉行尾换行', '保留内部空格'],
    starter: String.raw`#include <stdio.h>

int main(void) {
    char line[512];
    if (scanf("%511s", line) != 1) return 0;
    puts(line);
    return 0;
}
`,
    tests: [
      { name: '包含空格', input: 'hello C world\n', expected: 'hello C world' },
      { name: '多个空格', input: 'a  b   c\n', expected: 'a  b   c' }
    ],
    hints: ['fgets 会读取空格，但也会保留换行。', 'strcspn 可以定位 \\r 或 \\n。'],
    solution: String.raw`#include <stdio.h>
#include <string.h>

int main(void) {
    char line[512];
    if (!fgets(line, sizeof line, stdin)) return 0;
    line[strcspn(line, "\r\n")] = '\0';
    puts(line);
    return 0;
}
`
  }),
  ptaLab({
    id: 'pta-scanf-count',
    title: '修 Bug：scanf 变量数量不一致',
    moduleId: 'stdio-core',
    track: 'scanf 参数个数',
    tier: 'PTA 错因修复',
    level: 3,
    minutes: 12,
    functions: ['scanf', 'printf'],
    origin: '改编自 pta-c-checker 规则 R04（原项目测试场景）',
    ruleCodes: ['R04'],
    summary: '格式串有两个转换符，就必须提供两个对应地址。',
    prompt: '读取两个整数并输出和。修复 scanf 参数缺失导致的未定义行为。',
    requirements: ['格式符与参数一一对应', '检查 scanf 返回 2', '输出和'],
    starter: String.raw`#include <stdio.h>

int main(void) {
    int a, b;
    if (scanf("%d %d", &a) != 2) return 0;
    printf("%d\n", a + b);
    return 0;
}
`,
    tests: [
      { name: '两个正数', input: '8 9\n', expected: '17' },
      { name: '含负数', input: '-4 10\n', expected: '6' }
    ],
    hints: ['数一数格式串里有几个 %d。', '第二个 int 也需要传入地址。'],
    solution: String.raw`#include <stdio.h>

int main(void) {
    int a, b;
    if (scanf("%d %d", &a, &b) != 2) return 0;
    printf("%d\n", a + b);
    return 0;
}
`
  }),
  ptaLab({
    id: 'pta-pointer-swap',
    title: '动手写：用指针交换两个数',
    moduleId: 'stdlib-core',
    track: '函数参数 / 指针',
    tier: '函数设计',
    level: 3,
    minutes: 18,
    functions: ['scanf', 'printf'],
    origin: '原创题，延续 PTA 的指针与函数参数训练',
    summary: '通过 int* 参数让函数真正修改调用者的变量。',
    prompt: '读取两个整数 a、b。实现 swap(int *x, int *y) 交换它们的值，再输出交换后的 a 和 b。',
    requirements: ['swap 接收两个 int*', '不能在 main 中直接交换', '输出格式为 a b'],
    starter: String.raw`#include <stdio.h>

void swap(int x, int y) {
    int tmp = x;
    x = y;
    y = tmp;
}

int main(void) {
    int a, b;
    if (scanf("%d %d", &a, &b) != 2) return 0;
    swap(a, b);
    printf("%d %d\n", a, b);
    return 0;
}
`,
    tests: [
      { name: '普通交换', input: '3 7\n', expected: '7 3' },
      { name: '含负数', input: '-2 5\n', expected: '5 -2' }
    ],
    hints: ['按值传递只会修改副本。', 'swap 内部需要用 *x 和 *y 解引用。'],
    solution: String.raw`#include <stdio.h>

void swap(int *x, int *y) {
    int tmp = *x;
    *x = *y;
    *y = tmp;
}

int main(void) {
    int a, b;
    if (scanf("%d %d", &a, &b) != 2) return 0;
    swap(&a, &b);
    printf("%d %d\n", a, b);
    return 0;
}
`
  }),
  ptaLab({
    id: 'pta-nonempty-lines',
    title: '动手写：统计非空行',
    moduleId: 'stdio-core',
    track: 'fgets + 行尾处理',
    tier: '流处理',
    level: 3,
    minutes: 18,
    functions: ['fgets', 'strcspn', 'strlen'],
    origin: '原创题，借鉴 pta-c-checker 对 EOF 和行输入的检查场景',
    summary: '持续读取直到 EOF，统计去掉行尾空白后仍有内容的行。',
    prompt: '输入任意多行文本，直到 EOF。空行或只包含空格、制表符的行不计入。输出非空行数量。',
    requirements: ['读取到 EOF', '用 fgets 处理整行', '空行与纯空白行不计数'],
    starter: String.raw`#include <stdio.h>
#include <string.h>

int main(void) {
    char line[1024];
    int count = 0;
    /* TODO: 逐行读取并判断是否为非空行。 */
    printf("%d\n", count);
    return 0;
}
`,
    tests: [
      { name: '混合行', input: 'first\n\n  \nsecond\n', expected: '2' },
      { name: '全为空行', input: '\n \n\t\n', expected: '0' },
      { name: '单行', input: 'hello\n', expected: '1' }
    ],
    hints: ['去掉行尾换行后，还要跳过行首空白。', '可遍历字符判断是否出现非空白字符。'],
    solution: String.raw`#include <ctype.h>
#include <stdio.h>
#include <string.h>

int main(void) {
    char line[1024];
    int count = 0;
    while (fgets(line, sizeof line, stdin)) {
        int has_content = 0;
        for (size_t i = 0; line[i] != '\0'; i++) {
            if (!isspace((unsigned char)line[i])) {
                has_content = 1;
                break;
            }
        }
        if (has_content) count++;
    }
    printf("%d\n", count);
    return 0;
}
`
  })
];
