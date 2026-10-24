// 综合实验题：全部使用 stdin/stdout 契约，可由服务端 gcc 编译并逐例判分。
const lab = (data) => ({ difficulty: '中等', targetMinutes: 25, ...data });

export const exercises = [
  lab({
    id: 'palindrome',
    title: '回文哨兵：过滤非字母字符',
    moduleId: 'string-core',
    track: '字符串 + ctype',
    tier: '单点应用',
    minutes: 20,
    functions: ['fgets', 'strlen', 'isalnum', 'tolower'],
    summary: '读取一行文本，忽略大小写与非字母数字字符，判断它是否为回文。',
    prompt: '输入一行不超过 500 字符的文本。忽略大小写、空格和所有非字母数字字符后，若正读与反读相同输出 YES，否则输出 NO。',
    requirements: ['只读取一行', '使用 ctype.h 的字符分类或转换函数', '空字符串或只含标点时应视为回文'],
    starter: String.raw`#include <ctype.h>
#include <stdio.h>
#include <string.h>

int main(void) {
    char line[512];
    if (fgets(line, sizeof line, stdin) == NULL) return 0;

    /* TODO: 用双指针跳过非字母数字，并忽略大小写比较。 */
    puts("NO");
    return 0;
}
`,
    tests: [
      { name: '经典回文', input: 'A man, a plan, a canal: Panama\n', expected: 'YES' },
      { name: '普通句子', input: 'hello world\n', expected: 'NO' },
      { name: '只有标点', input: '...!?\n', expected: 'YES' }
    ],
    hints: ['左指针从 0 向右，右指针从 strlen(line)-1 向左。', '循环中先跳过 isalnum 为假的字符，再用 tolower 比较。'],
    solution: String.raw`#include <ctype.h>
#include <stdio.h>
#include <string.h>

int main(void) {
    char line[512];
    if (fgets(line, sizeof line, stdin) == NULL) return 0;
    size_t n = strlen(line);
    size_t left = 0, right = n;
    while (right > 0 && isspace((unsigned char)line[right - 1])) right--;
    while (left < right) {
        while (left < right && !isalnum((unsigned char)line[left])) left++;
        while (left < right && !isalnum((unsigned char)line[right - 1])) right--;
        if (left >= right) break;
        if (tolower((unsigned char)line[left]) != tolower((unsigned char)line[right - 1])) {
            puts("NO");
            return 0;
        }
        left++;
        right--;
    }
    puts("YES");
    return 0;
}
`
  }),
  lab({
    id: 'word-count',
    title: '工程日志词数统计',
    moduleId: 'ctype',
    track: '字符分类 + 流读取',
    tier: '单点应用',
    minutes: 20,
    functions: ['fgets', 'isspace'],
    summary: '持续读取文本直到 EOF，统计由空白分隔的单词数量。',
    prompt: '从标准输入读取任意多行文本。单词由连续的非空白字符组成，输出单词总数。',
    requirements: ['读取到 EOF，而不是只处理一行', '连续空白不能重复计数', '使用 isspace 判断词边界'],
    starter: String.raw`#include <ctype.h>
#include <stdio.h>

int main(void) {
    char line[1024];
    int words = 0;
    int in_word = 0;

    while (fgets(line, sizeof line, stdin) != NULL) {
        /* TODO: 遍历字符并更新状态机。 */
    }
    printf("%d\n", words);
    return 0;
}
`,
    tests: [
      { name: '多行文本', input: 'Hello, world!\nC is fun.\n', expected: '5' },
      { name: '全是空白', input: '   \n\t\n', expected: '0' },
      { name: '单个单词', input: 'one\n', expected: '1' }
    ],
    hints: ['维护 in_word 状态，只在“从空白进入非空白”时让 words 加一。'],
    solution: String.raw`#include <ctype.h>
#include <stdio.h>

int main(void) {
    char line[1024];
    int words = 0;
    int in_word = 0;

    while (fgets(line, sizeof line, stdin) != NULL) {
        for (size_t i = 0; line[i] != '\0'; i++) {
            unsigned char ch = (unsigned char)line[i];
            if (isspace(ch)) {
                in_word = 0;
            } else if (!in_word) {
                in_word = 1;
                words++;
            }
        }
    }
    printf("%d\n", words);
    return 0;
}
`
  }),
  lab({
    id: 'substring-count',
    title: '子串雷达：非重叠匹配计数',
    moduleId: 'string-core',
    track: 'strstr + 指针移动',
    tier: '单点应用',
    minutes: 20,
    functions: ['fgets', 'strlen', 'strstr'],
    summary: '在两行输入中统计模式串在文本里出现了多少次，匹配之间不重叠。',
    prompt: '第一行是文本，第二行是模式串。输出模式串在文本中出现的非重叠次数。模式串非空。',
    requirements: ['去除 fgets 留下的换行', '使用 strstr 查找', '一次匹配后从匹配位置之后继续搜索'],
    starter: String.raw`#include <stdio.h>
#include <string.h>

int main(void) {
    char text[2048], pattern[256];
    if (!fgets(text, sizeof text, stdin)) return 0;
    if (!fgets(pattern, sizeof pattern, stdin)) return 0;

    /* TODO: 去掉换行并统计非重叠出现次数。 */
    printf("0\n");
    return 0;
}
`,
    tests: [
      { name: '重叠候选', input: 'aaaa\naa\n', expected: '2' },
      { name: '普通匹配', input: 'banana\nana\n', expected: '1' },
      { name: '没有匹配', input: 'abc\nx\n', expected: '0' }
    ],
    hints: ['文本为 aaaa、模式为 aa 时，非重叠计数应为 2。'],
    solution: String.raw`#include <stdio.h>
#include <string.h>

static void chomp(char *s) {
    size_t n = strlen(s);
    while (n > 0 && (s[n - 1] == '\n' || s[n - 1] == '\r')) s[--n] = '\0';
}

int main(void) {
    char text[2048], pattern[256];
    if (!fgets(text, sizeof text, stdin)) return 0;
    if (!fgets(pattern, sizeof pattern, stdin)) return 0;
    chomp(text);
    chomp(pattern);

    int count = 0;
    const char *cursor = text;
    size_t step = strlen(pattern);
    while (step > 0 && (cursor = strstr(cursor, pattern)) != NULL) {
        count++;
        cursor += step;
    }
    printf("%d\n", count);
    return 0;
}
`
  }),
  lab({
    id: 'safe-join',
    title: '安全拼接文件路径',
    moduleId: 'stdio-core',
    track: 'snprintf + 容量控制',
    tier: '工程习惯',
    minutes: 20,
    functions: ['fgets', 'strlen', 'snprintf'],
    summary: '把目录与文件名拼成唯一一个分隔符的路径，并检测截断。',
    prompt: '读取两行：目录和文件名。输出拼接后的路径，目录与文件名之间恰好一个 /。若结果被截断输出 ERROR。',
    requirements: ['目录为空时不加前导斜杠', '目录末尾已有 / 时不重复添加', '使用 snprintf 检查截断'],
    starter: String.raw`#include <stdio.h>
#include <string.h>

int main(void) {
    char dir[256], file[256], result[512];
    if (!fgets(dir, sizeof dir, stdin)) return 0;
    if (!fgets(file, sizeof file, stdin)) return 0;

    /* TODO: 去换行，拼接，并处理目录末尾的斜杠。 */
    return 0;
}
`,
    tests: [
      { name: '普通路径', input: '/tmp\nlog.txt\n', expected: '/tmp/log.txt' },
      { name: '已有斜杠', input: '/tmp/\nlog.txt\n', expected: '/tmp/log.txt' },
      { name: '空目录', input: '\nfile.txt\n', expected: 'file.txt' }
    ],
    hints: ['先去掉两行末尾的换行符。', '比较目录最后一个字符是否为 /，再决定格式串。'],
    solution: String.raw`#include <stdio.h>
#include <string.h>

static void chomp(char *s) {
    size_t n = strlen(s);
    while (n > 0 && (s[n - 1] == '\n' || s[n - 1] == '\r')) s[--n] = '\0';
}

int main(void) {
    char dir[256], file[256], result[512];
    if (!fgets(dir, sizeof dir, stdin)) return 0;
    if (!fgets(file, sizeof file, stdin)) return 0;
    chomp(dir);
    chomp(file);

    int needed;
    if (dir[0] == '\0') needed = snprintf(result, sizeof result, "%s", file);
    else if (dir[strlen(dir) - 1] == '/') needed = snprintf(result, sizeof result, "%s%s", dir, file);
    else needed = snprintf(result, sizeof result, "%s/%s", dir, file);

    if (needed < 0 || (size_t)needed >= sizeof result) puts("ERROR");
    else puts(result);
    return 0;
}
`
  }),
  lab({
    id: 'csv-max',
    title: 'CSV 最高分记录',
    moduleId: 'string-core',
    track: 'strtok + strtol',
    tier: '数据解析',
    minutes: 25,
    functions: ['fgets', 'strtok', 'strtol', 'snprintf'],
    summary: '解析 N 行 name,score 记录，输出最高分学生姓名；同分保留最先出现者。',
    prompt: '第一行是记录数 N（1 ≤ N ≤ 100）。接下来 N 行格式为 name,score。输出最高分记录中的 name，不加额外空格。',
    requirements: ['分数用 strtol 解析', '姓名可能包含普通字母和数字', '同分时保留第一条记录'],
    starter: String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    getchar();

    char best_name[128] = "";
    long best_score = -1;
    char line[256];

    for (int i = 0; i < n; i++) {
        if (!fgets(line, sizeof line, stdin)) break;
        /* TODO: 用 strtok 取 name 和 score，比较并更新 best。 */
    }
    puts(best_name);
    return 0;
}
`,
    tests: [
      { name: '普通最高分', input: '3\nalice,88\nbob,93\ncara,75\n', expected: 'bob' },
      { name: '同分保留第一条', input: '2\nann,10\nben,10\n', expected: 'ann' },
      { name: '只有一条', input: '1\nx,0\n', expected: 'x' }
    ],
    hints: ['fgets 读到的换行会进入 score 字段，但 strtol 可忽略尾部换行。', '仅当 score 严格大于 best_score 时更新。'],
    solution: String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    getchar();

    char best_name[128] = "";
    long best_score = -1;
    char line[256];

    for (int i = 0; i < n; i++) {
        if (!fgets(line, sizeof line, stdin)) break;
        char *name = strtok(line, ",");
        char *score_text = strtok(NULL, ",");
        if (!name || !score_text) continue;
        long score = strtol(score_text, NULL, 10);
        if (score > best_score) {
            best_score = score;
            snprintf(best_name, sizeof best_name, "%s", name);
        }
    }
    puts(best_name);
    return 0;
}
`
  }),
  lab({
    id: 'strict-int-sum',
    title: '严格整数解析器',
    moduleId: 'stdlib-core',
    track: 'strtol + errno',
    tier: '错误处理',
    minutes: 25,
    functions: ['strtol', 'errno'],
    summary: '解析空格分隔的整数直到 END，累加合法整数并统计非法项。',
    prompt: '读取若干空格或换行分隔的 token，直到 token 为 END。支持十进制、八进制和十六进制前缀。输出合法 token 的总和与非法 token 数量，格式为：sum invalid。',
    requirements: ['使用 strtol 和 base=0', '整个 token 都必须被消费', '溢出、空数字、尾随字符都算非法'],
    starter: String.raw`#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    char token[128];
    long sum = 0;
    int invalid = 0;

    while (scanf("%127s", token) == 1) {
        if (strcmp(token, "END") == 0) break;
        /* TODO: 严格解析并计入 sum 或 invalid。 */
    }
    printf("%ld %d\n", sum, invalid);
    return 0;
}
`,
    tests: [
      { name: '合法混合进制', input: '10 0x10 -3 END\n', expected: '23 0' },
      { name: '多种非法输入', input: '10 abc 0x 999999999999999999999999 END\n', expected: '10 3' }
    ],
    hints: ['每次解析前 errno = 0。', '合法性条件是 endptr != token、*endptr == 0 且 errno != ERANGE。'],
    solution: String.raw`#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    char token[128];
    long sum = 0;
    int invalid = 0;

    while (scanf("%127s", token) == 1) {
        if (strcmp(token, "END") == 0) break;
        char *end = NULL;
        errno = 0;
        long value = strtol(token, &end, 0);
        if (errno == ERANGE || end == token || *end != '\0') invalid++;
        else sum += value;
    }
    printf("%ld %d\n", sum, invalid);
    return 0;
}
`
  }),
  lab({
    id: 'dynamic-stats',
    title: '动态数组描述统计',
    moduleId: 'stdlib-core',
    track: 'malloc + realloc + free',
    tier: '内存管理',
    minutes: 30,
    functions: ['malloc', 'realloc', 'free', 'fmin', 'fmax'],
    summary: '使用动态数组接收 N 个浮点数，输出最小值、最大值和平均值。',
    prompt: '第一行是 N（1 ≤ N ≤ 1000），第二行有 N 个浮点数。输出 min max avg，均保留两位小数。',
    requirements: ['使用动态分配而不是固定大小数组', '每次扩容都必须检查 realloc 返回值', '程序结束前释放所有堆内存'],
    starter: String.raw`#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int n;
    if (scanf("%d", &n) != 1) return 0;

    double *values = NULL;
    size_t capacity = 0;
    /* TODO: 为 n 个 double 分配空间并读取数据。 */

    free(values);
    return 0;
}
`,
    tests: [
      { name: '普通数据', input: '5\n3 1 4 1.5 2\n', expected: '1.00 4.00 2.30' },
      { name: '单个数值', input: '1\n-2.5\n', expected: '-2.50 -2.50 -2.50' }
    ],
    hints: ['可以先用 malloc(n * sizeof *values)，再读取。', '若要展示 realloc，可从小容量开始逐步扩容，但一定要用临时指针。'],
    solution: String.raw`#include <math.h>
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int n;
    if (scanf("%d", &n) != 1 || n < 1) return 0;

    double *values = NULL;
    size_t capacity = 0;
    double sum = 0.0;
    for (int i = 0; i < n; i++) {
        double value;
        if (scanf("%lf", &value) != 1) break;
        if ((size_t)i >= capacity) {
            size_t next = capacity == 0 ? 4 : capacity * 2;
            double *grown = realloc(values, next * sizeof *values);
            if (!grown) {
                free(values);
                return 0;
            }
            values = grown;
            capacity = next;
        }
        values[i] = value;
        sum += value;
    }

    double minimum = values[0], maximum = values[0];
    for (int i = 1; i < n; i++) {
        minimum = fmin(minimum, values[i]);
        maximum = fmax(maximum, values[i]);
    }
    printf("%.2f %.2f %.2f\n", minimum, maximum, sum / n);
    free(values);
    return 0;
}
`
  }),
  lab({
    id: 'rank-scores',
    title: '成绩榜：qsort 双关键字排序',
    moduleId: 'stdlib-core',
    track: 'qsort + strcmp',
    tier: '排序',
    minutes: 30,
    functions: ['qsort', 'strcmp', 'snprintf'],
    summary: '按分数降序、姓名升序排列学生记录并逐行输出姓名。',
    prompt: '第一行是 N（1 ≤ N ≤ 100）。随后 N 行格式为 name score。分数降序排序，同分时姓名按 strcmp 升序。每行输出一个姓名。',
    requirements: ['使用 qsort', '比较器必须同时处理分数与姓名', '姓名长度不超过 63'],
    starter: String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    char name[64];
    int score;
} Student;

int compare_students(const void *a, const void *b) {
    /* TODO: 分数高的在前；同分时 strcmp 小的在前。 */
    return 0;
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    Student students[100];
    for (int i = 0; i < n; i++) {
        scanf("%63s %d", students[i].name, &students[i].score);
    }
    qsort(students, (size_t)n, sizeof students[0], compare_students);
    for (int i = 0; i < n; i++) puts(students[i].name);
    return 0;
}
`,
    tests: [
      { name: '分数与同分姓名', input: '4\nzoe 90\namy 95\nbob 90\ncal 70\n', expected: 'amy\nbob\nzoe\ncal' },
      { name: '全部同分', input: '3\nc 10\na 10\nb 10\n', expected: 'a\nb\nc' }
    ],
    hints: ['分数降序时，a 较小应返回正数。', '不要把分数直接相减后作为两个排序键的混合结果。'],
    solution: String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    char name[64];
    int score;
} Student;

int compare_students(const void *a, const void *b) {
    const Student *left = a;
    const Student *right = b;
    if (left->score != right->score) return left->score < right->score ? 1 : -1;
    return strcmp(left->name, right->name);
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    Student students[100];
    for (int i = 0; i < n; i++) {
        scanf("%63s %d", students[i].name, &students[i].score);
    }
    qsort(students, (size_t)n, sizeof students[0], compare_students);
    for (int i = 0; i < n; i++) puts(students[i].name);
    return 0;
}
`
  }),
  lab({
    id: 'binary-search-index',
    title: '有序数组定位器',
    moduleId: 'stdlib-core',
    track: 'bsearch + 比较器',
    tier: '查找',
    minutes: 20,
    functions: ['bsearch'],
    summary: '在升序整数数组中用 bsearch 查找目标值，输出零基下标或 -1。',
    prompt: '第一行是 N，第二行是 N 个严格升序整数，第三行是目标值。输出目标值的零基下标；不存在则输出 -1。',
    requirements: ['使用 bsearch', '比较器与数组元素类型一致', '不得先线性扫描找到下标再调用 bsearch'],
    starter: String.raw`#include <stdio.h>
#include <stdlib.h>

int compare_int(const void *a, const void *b) {
    int left = *(const int *)a;
    int right = *(const int *)b;
    return (left > right) - (left < right);
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int values[1000];
    for (int i = 0; i < n; i++) scanf("%d", &values[i]);
    int target;
    if (scanf("%d", &target) != 1) return 0;

    /* TODO: bsearch，之后把指针差转换为下标。 */
    puts("-1");
    return 0;
}
`,
    tests: [
      { name: '中间命中', input: '5\n1 3 5 7 9\n7\n', expected: '3' },
      { name: '首项命中', input: '4\n-2 0 4 8\n-2\n', expected: '0' },
      { name: '不存在', input: '5\n2 4 6 8 10\n5\n', expected: '-1' }
    ],
    hints: ['把 target 的地址作为 key。', 'bsearch 返回 void*，转换为 int* 后与 values 相减。'],
    solution: String.raw`#include <stdio.h>
#include <stdlib.h>

int compare_int(const void *a, const void *b) {
    int left = *(const int *)a;
    int right = *(const int *)b;
    return (left > right) - (left < right);
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int values[1000];
    for (int i = 0; i < n; i++) scanf("%d", &values[i]);
    int target;
    if (scanf("%d", &target) != 1) return 0;

    int *found = bsearch(&target, values, (size_t)n, sizeof values[0], compare_int);
    if (found) printf("%d\n", (int)(found - values));
    else puts("-1");
    return 0;
}
`
  }),
  lab({
    id: 'quadratic-roots',
    title: '二次方程的数值边界',
    moduleId: 'math-numeric',
    track: 'sqrt + fabs',
    tier: '数学建模',
    minutes: 25,
    functions: ['sqrt', 'fabs', 'isnan'],
    summary: '求二次方程实根，正确处理重根、无实根和负零输出。',
    prompt: '输入 a b c（a 非零）。若有两个实根，按从小到大输出 x1=... x2=...；若为重根输出 x=...；若无实根输出 NO_REAL。所有数值保留两位小数。',
    requirements: ['使用 sqrt 计算判别式', '用容差判断重根，避免浮点误差', '不要把 -0.00 输出给用户'],
    starter: String.raw`#include <math.h>
#include <stdio.h>

int main(void) {
    double a, b, c;
    if (scanf("%lf %lf %lf", &a, &b, &c) != 3 || a == 0.0) return 0;

    double discriminant = b * b - 4.0 * a * c;
    /* TODO: 分三类输出，并消除 -0.00。 */
    return 0;
}
`,
    tests: [
      { name: '两个实根', input: '1 -3 2\n', expected: 'x1=1.00 x2=2.00' },
      { name: '重根', input: '1 2 1\n', expected: 'x=-1.00' },
      { name: '无实根', input: '1 0 1\n', expected: 'NO_REAL' }
    ],
    hints: ['判别式接近 0 时视为重根。', '根为 -b/(2a)±sqrt(d)/(2a)，排序后再输出。'],
    solution: String.raw`#include <math.h>
#include <stdio.h>

static double clean_zero(double x) {
    return fabs(x) < 0.0005 ? 0.0 : x;
}

int main(void) {
    double a, b, c;
    if (scanf("%lf %lf %lf", &a, &b, &c) != 3 || a == 0.0) return 0;

    double d = b * b - 4.0 * a * c;
    if (d < 0.0 && fabs(d) >= 1e-9) {
        puts("NO_REAL");
    } else if (fabs(d) < 1e-9) {
        printf("x=%.2f\n", clean_zero(-b / (2.0 * a)));
    } else {
        double root = sqrt(d);
        double x1 = (-b - root) / (2.0 * a);
        double x2 = (-b + root) / (2.0 * a);
        if (x1 > x2) {
            double tmp = x1;
            x1 = x2;
            x2 = tmp;
        }
        printf("x1=%.2f x2=%.2f\n", clean_zero(x1), clean_zero(x2));
    }
    return 0;
}
`
  }),
  lab({
    id: 'polar-coordinates',
    title: '极坐标转换器',
    moduleId: 'math-numeric',
    track: 'hypot + atan2',
    tier: '数学建模',
    minutes: 20,
    functions: ['hypot', 'atan2', 'acos'],
    summary: '把平面直角坐标转换为半径与角度，角度使用 [-180, 180] 度。',
    prompt: '输入 x y。输出 r=<半径> theta=<角度>，都保留两位小数。角度单位为度，原点角度定义为 0。',
    requirements: ['半径使用 hypot', '角度使用 atan2(y, x)', '角度由弧度转换为度'],
    starter: String.raw`#include <math.h>
#include <stdio.h>

int main(void) {
    double x, y;
    if (scanf("%lf %lf", &x, &y) != 2) return 0;

    /* TODO: 计算半径和角度。 */
    return 0;
}
`,
    tests: [
      { name: '第一象限', input: '3 4\n', expected: 'r=5.00 theta=53.13' },
      { name: '负 x 轴', input: '-1 0\n', expected: 'r=1.00 theta=180.00' },
      { name: '原点', input: '0 0\n', expected: 'r=0.00 theta=0.00' }
    ],
    hints: ['pi 可以用 acos(-1.0) 得到。', 'atan2 的参数顺序是 y, x。'],
    solution: String.raw`#include <math.h>
#include <stdio.h>

int main(void) {
    double x, y;
    if (scanf("%lf %lf", &x, &y) != 2) return 0;

    double radius = hypot(x, y);
    double theta = (x == 0.0 && y == 0.0) ? 0.0 : atan2(y, x) * 180.0 / acos(-1.0);
    if (fabs(theta) < 0.0005) theta = 0.0;
    printf("r=%.2f theta=%.2f\n", radius, theta);
    return 0;
}
`
  }),
  lab({
    id: 'rounding-directions',
    title: '四种舍入方向对照',
    moduleId: 'math-numeric',
    track: 'floor + ceil + round + trunc',
    tier: '数值细节',
    minutes: 20,
    functions: ['floor', 'ceil', 'round', 'trunc'],
    summary: '对同一个浮点数同时应用四种舍入函数，观察正负数差异。',
    prompt: '输入一个浮点数 x。输出 floor=<...> ceil=<...> round=<...> trunc=<...>，每个值不保留小数。',
    requirements: ['分别调用 floor、ceil、round、trunc', '输出顺序固定', '负数也必须使用正确方向'],
    starter: String.raw`#include <math.h>
#include <stdio.h>

int main(void) {
    double x;
    if (scanf("%lf", &x) != 1) return 0;

    /* TODO: 输出四种舍入结果。 */
    return 0;
}
`,
    tests: [
      { name: '正数半值', input: '2.5\n', expected: 'floor=2 ceil=3 round=3 trunc=2' },
      { name: '负数半值', input: '-2.5\n', expected: 'floor=-3 ceil=-2 round=-3 trunc=-2' },
      { name: '整数', input: '3\n', expected: 'floor=3 ceil=3 round=3 trunc=3' }
    ],
    hints: ['round 的 .5 规则是远离 0。', '可以用 %.0f 输出这些 double 值。'],
    solution: String.raw`#include <math.h>
#include <stdio.h>

int main(void) {
    double x;
    if (scanf("%lf", &x) != 1) return 0;
    printf("floor=%.0f ceil=%.0f round=%.0f trunc=%.0f\n",
           floor(x), ceil(x), round(x), trunc(x));
    return 0;
}
`
  }),
  lab({
    id: 'float-close',
    title: '浮点近似比较器',
    moduleId: 'math-numeric',
    track: 'fabs + 容差',
    tier: '精度',
    minutes: 20,
    functions: ['fabs'],
    summary: '成对比较浮点数，在容差 1e-6 内视为相等并计数。',
    prompt: '第一行是 N。接下来输入 N 对浮点数 a b。若 |a-b| ≤ 1e-6 则计为相等。输出相等对数。',
    requirements: ['使用 fabs', '不要用 == 直接比较浮点数', '容差固定为 1e-6'],
    starter: String.raw`#include <math.h>
#include <stdio.h>

int main(void) {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int equal_count = 0;
    /* TODO: 读取 n 对并比较。 */
    printf("%d\n", equal_count);
    return 0;
}
`,
    tests: [
      { name: '有效误差', input: '3\n0.1 0.1000004\n1.0 1.1\n2.0 1.9999995\n', expected: '2' },
      { name: '全部不相等', input: '2\n1 2\n3 3.001\n', expected: '0' }
    ],
    hints: ['if (fabs(a-b) <= 1e-6) 即满足题目的相等定义。'],
    solution: String.raw`#include <math.h>
#include <stdio.h>

int main(void) {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int equal_count = 0;
    for (int i = 0; i < n; i++) {
        double a, b;
        if (scanf("%lf %lf", &a, &b) != 2) break;
        if (fabs(a - b) <= 1e-6) equal_count++;
    }
    printf("%d\n", equal_count);
    return 0;
}
`
  }),
  lab({
    id: 'utc-format',
    title: 'UTC 时间戳格式化',
    moduleId: 'time-core',
    track: 'gmtime + strftime',
    tier: '时间',
    minutes: 20,
    functions: ['gmtime', 'strftime'],
    summary: '把 Unix 时间戳转换为固定的 UTC 日期时间字符串。',
    prompt: '输入一个 time_t 范围内的整数时间戳。输出 UTC 时间，格式为 YYYY-MM-DD HH:MM:SS。不要使用本地时区。',
    requirements: ['使用 gmtime 而不是 localtime', '使用 strftime 格式化', '缓冲区容量与返回值都要检查'],
    starter: String.raw`#include <stdio.h>
#include <time.h>

int main(void) {
    long long value;
    if (scanf("%lld", &value) != 1) return 0;

    time_t stamp = (time_t)value;
    struct tm *utc = gmtime(&stamp);
    if (!utc) return 0;

    char output[32];
    /* TODO: 用 strftime 生成 YYYY-MM-DD HH:MM:SS。 */
    return 0;
}
`,
    tests: [
      { name: 'Unix 纪元', input: '0\n', expected: '1970-01-01 00:00:00' },
      { name: '跨越 2000 年', input: '946684800\n', expected: '2000-01-01 00:00:00' },
      { name: '普通时间戳', input: '1700000000\n', expected: '2023-11-14 22:13:20' }
    ],
    hints: ['格式串是 "%Y-%m-%d %H:%M:%S"。', 'strftime 返回 0 时应视为格式化失败。'],
    solution: String.raw`#include <stdio.h>
#include <time.h>

int main(void) {
    long long value;
    if (scanf("%lld", &value) != 1) return 0;

    time_t stamp = (time_t)value;
    struct tm *utc = gmtime(&stamp);
    if (!utc) return 0;

    char output[32];
    if (strftime(output, sizeof output, "%Y-%m-%d %H:%M:%S", utc) == 0) return 0;
    puts(output);
    return 0;
}
`
  }),
  lab({
    id: 'elapsed-seconds',
    title: '同日时间差计算器',
    moduleId: 'time-core',
    track: 'mktime + difftime',
    tier: '时间',
    minutes: 20,
    functions: ['mktime', 'difftime'],
    summary: '把两个时分秒字段转换为日历时间，并计算它们之间相差的秒数。',
    prompt: '输入两行，每行三个整数 hh mm ss，表示同一天内的两个时间。第一行是开始时间，第二行是结束时间。输出结束减开始的秒数。',
    requirements: ['使用 mktime 转换日历字段', '使用 difftime 计算差值', '不要把三个字段直接拼成秒数相减'],
    starter: String.raw`#include <stdio.h>
#include <time.h>

static time_t make_time(int hour, int minute, int second) {
    struct tm value = {0};
    value.tm_year = 2000 - 1900;
    value.tm_mon = 0;
    value.tm_mday = 1;
    value.tm_hour = hour;
    value.tm_min = minute;
    value.tm_sec = second;
    value.tm_isdst = -1;
    return mktime(&value);
}

int main(void) {
    int h1, m1, s1, h2, m2, s2;
    if (scanf("%d%d%d%d%d%d", &h1, &m1, &s1, &h2, &m2, &s2) != 6) return 0;

    /* TODO: 转换两次并用 difftime 输出整数秒。 */
    return 0;
}
`,
    tests: [
      { name: '一分钟半', input: '8 0 0\n8 1 30\n', expected: '90' },
      { name: '半小时', input: '10 0 0\n9 30 0\n', expected: '-1800' },
      { name: '同一时刻', input: '12 0 0\n12 0 0\n', expected: '0' }
    ],
    hints: ['mktime 可能返回 (time_t)-1，应检查。', 'difftime 返回 double，题目结果恰好为整数，可用 %.0f 输出。'],
    solution: String.raw`#include <math.h>
#include <stdio.h>
#include <time.h>

static time_t make_time(int hour, int minute, int second) {
    struct tm value = {0};
    value.tm_year = 2000 - 1900;
    value.tm_mon = 0;
    value.tm_mday = 1;
    value.tm_hour = hour;
    value.tm_min = minute;
    value.tm_sec = second;
    value.tm_isdst = -1;
    return mktime(&value);
}

int main(void) {
    int h1, m1, s1, h2, m2, s2;
    if (scanf("%d%d%d%d%d%d", &h1, &m1, &s1, &h2, &m2, &s2) != 6) return 0;

    time_t start = make_time(h1, m1, s1);
    time_t end = make_time(h2, m2, s2);
    if (start == (time_t)-1 || end == (time_t)-1) return 0;
    printf("%.0f\n", difftime(end, start));
    return 0;
}
`
  }),
  lab({
    id: 'line-filter',
    title: '日志关键字过滤器',
    moduleId: 'stdio-core',
    track: 'fgets + strstr',
    tier: '文件流思维',
    minutes: 20,
    functions: ['fgets', 'strstr', 'fputs'],
    summary: '从标准输入读取关键字，再筛选后续包含该关键字的行。',
    prompt: '第一行是关键字。之后读取任意多行日志，原样输出包含该关键字的行。关键字按普通子串匹配，区分大小写。',
    requirements: ['关键字行需要去掉换行', '日志行需要保留原换行', '包含关键字的整行原样输出'],
    starter: String.raw`#include <stdio.h>
#include <string.h>

int main(void) {
    char keyword[128];
    if (!fgets(keyword, sizeof keyword, stdin)) return 0;
    keyword[strcspn(keyword, "\r\n")] = '\0';

    char line[1024];
    while (fgets(line, sizeof line, stdin)) {
        /* TODO: 若 line 包含 keyword，则原样输出。 */
    }
    return 0;
}
`,
    tests: [
      { name: '筛选错误行', input: 'ERROR\nINFO start\nERROR disk full\nWARN retry\n', expected: 'ERROR disk full\n' },
      { name: '多行命中', input: 'user=\nuser=alice\nservice=api\nuser=bob\n', expected: 'user=alice\nuser=bob\n' },
      { name: '无命中', input: 'panic\nall good\n', expected: '' }
    ],
    hints: ['strstr 返回 NULL 表示不包含。', '用 fputs(line, stdout) 保留原始行内容。'],
    solution: String.raw`#include <stdio.h>
#include <string.h>

int main(void) {
    char keyword[128];
    if (!fgets(keyword, sizeof keyword, stdin)) return 0;
    keyword[strcspn(keyword, "\r\n")] = '\0';

    char line[1024];
    while (fgets(line, sizeof line, stdin)) {
        if (strstr(line, keyword)) fputs(line, stdout);
    }
    return 0;
}
`
  }),
  lab({
    id: 'text-insight',
    title: '文本字符画像',
    moduleId: 'ctype',
    track: 'ctype 分类统计',
    tier: '综合',
    minutes: 20,
    functions: ['getchar', 'isalpha', 'isdigit', 'isspace'],
    summary: '扫描全部输入，统计字母、数字、空白和其他字符的数量。',
    prompt: '从标准输入读取到 EOF。输出 letters=<n> digits=<n> spaces=<n> other=<n>。其中 spaces 使用 isspace 的判定范围，other 为剩余字符。',
    requirements: ['读取到 EOF', '空格统计包含换行、制表符等空白', '四类之和必须等于输入字符总数'],
    starter: String.raw`#include <ctype.h>
#include <stdio.h>

int main(void) {
    int ch;
    int letters = 0, digits = 0, spaces = 0, other = 0;

    while ((ch = getchar()) != EOF) {
        /* TODO: 按 ctype 分类统计。 */
    }
    printf("letters=%d digits=%d spaces=%d other=%d\n", letters, digits, spaces, other);
    return 0;
}
`,
    tests: [
      { name: '混合文本', input: 'Hi 42!\n', expected: 'letters=2 digits=2 spaces=2 other=1' },
      { name: '单个字母', input: 'C\n', expected: 'letters=1 digits=0 spaces=1 other=0' },
      { name: '仅换行', input: '\n', expected: 'letters=0 digits=0 spaces=1 other=0' }
    ],
    hints: ['getchar 返回 int，能可靠表示 EOF。', '先判断空白、字母、数字，否则归入 other。'],
    solution: String.raw`#include <ctype.h>
#include <stdio.h>

int main(void) {
    int ch;
    int letters = 0, digits = 0, spaces = 0, other = 0;

    while ((ch = getchar()) != EOF) {
        unsigned char byte = (unsigned char)ch;
        if (isspace(byte)) spaces++;
        else if (isalpha(byte)) letters++;
        else if (isdigit(byte)) digits++;
        else other++;
    }
    printf("letters=%d digits=%d spaces=%d other=%d\n", letters, digits, spaces, other);
    return 0;
}
`
  }),
  lab({
    id: 'score-report',
    title: '班级成绩分析报告',
    moduleId: 'stdlib-core',
    track: 'qsort + math + 字符串',
    tier: '综合',
    minutes: 40,
    functions: ['qsort', 'strcmp', 'sqrt', 'snprintf'],
    summary: '排序学生成绩并计算平均分、极值和总体标准差。',
    prompt: '第一行是 N。随后 N 行 name score。先按分数降序、姓名升序输出姓名，每行一个；最后输出 avg=... max=... min=... sd=...，保留两位小数。标准差使用总体标准差。',
    requirements: ['使用 qsort 双关键字排序', '使用 sqrt 计算总体标准差', '分数范围合理，姓名长度不超过 63'],
    starter: String.raw`#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    char name[64];
    int score;
} Student;

int cmp(const void *a, const void *b) {
    const Student *x = a;
    const Student *y = b;
    if (x->score != y->score) return x->score < y->score ? 1 : -1;
    return strcmp(x->name, y->name);
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1 || n < 1) return 0;
    Student students[100];
    /* TODO: 读取、排序、输出、统计。 */
    return 0;
}
`,
    tests: [
      { name: '三人样本', input: '3\nzoe 90\namy 70\nbob 80\n', expected: 'zoe\nbob\namy\navg=80.00 max=90 min=70 sd=8.16' },
      { name: '同分稳定次序', input: '3\nc 60\na 60\nb 60\n', expected: 'a\nb\nc\navg=60.00 max=60 min=60 sd=0.00' }
    ],
    hints: ['标准差需要先求平均，再累加平方差。', '排序后的第一名不一定等于最高分，但本题可按 score 独立统计。'],
    solution: String.raw`#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    char name[64];
    int score;
} Student;

int cmp(const void *a, const void *b) {
    const Student *x = a;
    const Student *y = b;
    if (x->score != y->score) return x->score < y->score ? 1 : -1;
    return strcmp(x->name, y->name);
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1 || n < 1) return 0;
    Student students[100];
    double sum = 0.0;
    int maximum = 0, minimum = 0;
    for (int i = 0; i < n; i++) {
        if (scanf("%63s %d", students[i].name, &students[i].score) != 2) return 0;
        sum += students[i].score;
        if (i == 0 || students[i].score > maximum) maximum = students[i].score;
        if (i == 0 || students[i].score < minimum) minimum = students[i].score;
    }
    qsort(students, (size_t)n, sizeof students[0], cmp);
    double average = sum / n;
    double variance = 0.0;
    for (int i = 0; i < n; i++) {
        double delta = students[i].score - average;
        variance += delta * delta;
    }
    variance /= n;
    for (int i = 0; i < n; i++) puts(students[i].name);
    printf("avg=%.2f max=%d min=%d sd=%.2f\n", average, maximum, minimum, sqrt(variance));
    return 0;
}
`
  }),
  lab({
    id: 'log-severity',
    title: '日志级别计数管线',
    moduleId: 'stdio-core',
    track: 'fgets + strncmp',
    tier: '综合',
    minutes: 25,
    functions: ['fgets', 'strncmp', 'strlen'],
    summary: '逐行读取日志，统计以 ERROR、WARN、INFO 开头的记录数量。',
    prompt: '读取任意多行日志直到 EOF。只统计行首严格以 ERROR、WARN 或 INFO 开头的行，其他行忽略。输出 ERROR=<n> WARN=<n> INFO=<n>。',
    requirements: ['使用 fgets 逐行读取', '匹配必须发生在行首', '空行和未知级别不计数'],
    starter: String.raw`#include <stdio.h>
#include <string.h>

int main(void) {
    char line[1024];
    int errors = 0, warnings = 0, infos = 0;

    while (fgets(line, sizeof line, stdin)) {
        /* TODO: 用 strncmp 判断行首级别。 */
    }
    printf("ERROR=%d WARN=%d INFO=%d\n", errors, warnings, infos);
    return 0;
}
`,
    tests: [
      { name: '混合日志', input: 'INFO boot\nERROR disk\nWARN retry\nERROR again\nDEBUG hidden\n', expected: 'ERROR=2 WARN=1 INFO=1' },
      { name: '非行首匹配', input: 'XINFO nope\n  ERROR nope\nINFO ok\n', expected: 'ERROR=0 WARN=0 INFO=1' }
    ],
    hints: ['每次比较前确保长度足够，strncmp 会安全地在 n 个字符或 \\0 处停止。', '不要用 strstr，因为它会匹配行中任意位置。'],
    solution: String.raw`#include <stdio.h>
#include <string.h>

int main(void) {
    char line[1024];
    int errors = 0, warnings = 0, infos = 0;

    while (fgets(line, sizeof line, stdin)) {
        if (strncmp(line, "ERROR", 5) == 0) errors++;
        else if (strncmp(line, "WARN", 4) == 0) warnings++;
        else if (strncmp(line, "INFO", 4) == 0) infos++;
    }
    printf("ERROR=%d WARN=%d INFO=%d\n", errors, warnings, infos);
    return 0;
}
`
  }),
  lab({
    id: 'isbn-validator',
    title: 'ISBN-10 校验器',
    moduleId: 'string-core',
    track: 'ctype + 字符扫描',
    tier: '综合',
    minutes: 25,
    functions: ['fgets', 'strlen', 'isdigit', 'toupper'],
    summary: '忽略连字符和空格，校验一个带加权和的 ISBN-10 号码。',
    prompt: '读取一行 ISBN。允许有连字符和空格；有效号码恰好包含 10 个字符，前 9 个为数字，最后一位为数字或 X。使用权重 1 到 10 的加权和模 11 校验，输出 VALID 或 INVALID。',
    requirements: ['忽略连字符和空格', '只允许最后一位使用 X/x 表示 10', '加权和必须能被 11 整除'],
    starter: String.raw`#include <ctype.h>
#include <stdio.h>
#include <string.h>

int main(void) {
    char line[128];
    if (!fgets(line, sizeof line, stdin)) return 0;

    int digits[10];
    int count = 0;
    int valid = 1;
    /* TODO: 收集字符并执行 ISBN-10 校验。 */
    puts(valid ? "VALID" : "INVALID");
    return 0;
}
`,
    tests: [
      { name: '数字结尾', input: '0-306-40615-2\n', expected: 'VALID' },
      { name: 'X 结尾', input: '0-8044-2957-X\n', expected: 'VALID' },
      { name: '校验位错误', input: '0-306-40615-3\n', expected: 'INVALID' }
    ],
    hints: ['权重可用 i+1，最后一位权重为 10。', '任何非法字符、数量不为 10 或模 11 非零都输出 INVALID。'],
    solution: String.raw`#include <ctype.h>
#include <stdio.h>
#include <string.h>

int main(void) {
    char line[128];
    if (!fgets(line, sizeof line, stdin)) return 0;

    int digits[10];
    int count = 0;
    int valid = 1;
    for (size_t i = 0; line[i] != '\0' && line[i] != '\n'; i++) {
        unsigned char ch = (unsigned char)line[i];
        if (ch == '-' || ch == ' ') continue;
        if (isdigit(ch)) {
            if (count >= 10) { valid = 0; break; }
            digits[count++] = ch - '0';
        } else if (toupper(ch) == 'X' && count == 9) {
            digits[count++] = 10;
        } else {
            valid = 0;
            break;
        }
    }

    if (count != 10) valid = 0;
    if (valid) {
        int sum = 0;
        for (int i = 0; i < 10; i++) sum += (i + 1) * digits[i];
        if (sum % 11 != 0) valid = 0;
    }
    puts(valid ? "VALID" : "INVALID");
    return 0;
}
`
  })
];


const levelNames = {
  1: 'L1 热身',
  2: 'L2 基础',
  3: 'L3 标准',
  4: 'L4 进阶',
  5: 'L5 综合'
};

const coreLevels = {
  palindrome: 2,
  'word-count': 2,
  'substring-count': 2,
  'safe-join': 3,
  'csv-max': 3,
  'strict-int-sum': 3,
  'dynamic-stats': 4,
  'rank-scores': 4,
  'binary-search-index': 3,
  'quadratic-roots': 3,
  'polar-coordinates': 2,
  'rounding-directions': 2,
  'float-close': 2,
  'utc-format': 3,
  'elapsed-seconds': 3,
  'line-filter': 2,
  'text-insight': 2,
  'score-report': 5,
  'log-severity': 3,
  'isbn-validator': 4
};

exercises.forEach((exercise) => {
  exercise.level = coreLevels[exercise.id] || 3;
  exercise.levelName = levelNames[exercise.level];
  exercise.origin = exercise.origin || '原创题，语义依据 ISO C11';
});
