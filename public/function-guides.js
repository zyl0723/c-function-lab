// 每道题中“本题函数精讲”的补充说明。原型、用途与常见坑来自 catalog.js。
const g = (use, example, result) => ({ use, example, result });

export const functionGuides = {
  acos: g(
    '用于求反余弦，返回值范围是 [0, π] 弧度。常配合 acos(-1.0) 获取 π。',
    String.raw`double pi = acos(-1.0);
printf("%.2f\n", pi);`,
    '输出约 3.14；参数必须在 [-1, 1] 内。'
  ),
  atan2: g(
    '根据 y 坐标和 x 坐标计算方位角，能正确区分四个象限，参数顺序是 (y, x)。',
    String.raw`double theta = atan2(1.0, -1.0);
printf("%.2f\n", theta * 180.0 / acos(-1.0));`,
    '输出约 135.00；交换参数会得到不同象限。'
  ),
  bsearch: g(
    '在已经按比较器排好序的数组中做二分查找，成功返回元素地址，失败返回 NULL。',
    String.raw`int a[] = {1, 3, 5, 7};
int key = 5;
int *p = bsearch(&key, a, 4, sizeof a[0], compare_int);
if (p) printf("index=%d\n", (int)(p - a));`,
    '输出 index=2；数组未排序时结果不可靠。'
  ),
  ceil: g(
    '向上取整：返回不小于 x 的最小整数值，结果类型仍是 double。',
    String.raw`printf("%.0f %.0f\n", ceil(1.2), ceil(-1.2));`,
    '输出 `2 -1`；负数是朝正无穷方向取整。'
  ),
  difftime: g(
    '计算两个 time_t 之间的秒数，结果是 double，参数顺序是“后减前”。',
    String.raw`time_t start = time(NULL);
/* 执行一些任务 */
time_t end = time(NULL);
printf("%.0f\n", difftime(end, start));`,
    '输出实际间隔的秒数；不要直接假定 time_t 一定是整数。'
  ),
  errno: g(
    'errno 不是函数，而是记录最近一次库函数错误码的宏。调用可能失败的函数前先置 0，再检查。',
    String.raw`errno = 0;
char *end = NULL;
long value = strtol("999999999999999999999", &end, 10);
if (errno == ERANGE) puts("overflow");`,
    '输出 overflow；不要用返回值单独判断所有错误。'
  ),
  fabs: g(
    '求 double 的绝对值。整数应使用 abs、labs 或 llabs。',
    String.raw`double d = fabs(-3.5);
printf("%.1f\n", d);`,
    '输出 3.5；它返回新值，不会修改原变量。'
  ),
  fgets: g(
    '从文件流读取一行，最多读取 size-1 个字符，并保留换行符、追加 \\0。',
    String.raw`char line[128];
if (fgets(line, sizeof line, stdin)) {
    line[strcspn(line, "\r\n")] = '\0';
    puts(line);
}`,
    '可以读取包含空格的整行；要自己处理行尾换行。'
  ),
  floor: g(
    '向下取整：返回不大于 x 的最大整数值。',
    String.raw`printf("%.0f %.0f\n", floor(1.8), floor(-1.2));`,
    '输出 `1 -2`；负数会离 0 更远。'
  ),
  fmax: g(
    '返回两个浮点数中的较大值，常用于比较并保留非 NaN 一侧。',
    String.raw`double biggest = fmax(3.2, 5.8);
printf("%.1f\n", biggest);`,
    '输出 5.8；不是可变参数函数，只接收两个参数。'
  ),
  fmin: g(
    '返回两个浮点数中的较小值，适合逐项维护最小值。',
    String.raw`double low = 10.0;
low = fmin(low, -2.5);
printf("%.1f\n", low);`,
    '输出 -2.5。'
  ),
  fputs: g(
    '把字符串写到指定流，不自动添加换行。',
    String.raw`fputs("hello", stdout);
fputs(" world\n", stdout);`,
    '输出 `hello world`；写入失败会返回 EOF。'
  ),
  free: g(
    '释放 malloc、calloc 或 realloc 得到的堆内存。传入 NULL 是允许的。',
    String.raw`int *p = malloc(10 * sizeof *p);
if (p) {
    p[0] = 42;
    printf("%d\n", p[0]);
    free(p);
}`,
    '输出 42；释放后不能继续访问，也不能重复释放。'
  ),
  getchar: g(
    '从标准输入读取一个字符，返回 int，以便区分普通字符和 EOF。',
    String.raw`int ch;
while ((ch = getchar()) != EOF) {
    putchar(ch);
}`,
    '逐字符回显输入；不要用 char 存返回值。'
  ),
  gmtime: g(
    '把 time_t 转换为 UTC 的 struct tm，不受本地时区影响。',
    String.raw`time_t now = 0;
struct tm *utc = gmtime(&now);
printf("%d-%02d-%02d\n", utc->tm_year + 1900,
       utc->tm_mon + 1, utc->tm_mday);`,
    '输出 1970-01-01。'
  ),
  hypot: g(
    '计算 sqrt(x*x + y*y)，并尽量避免中间结果溢出。',
    String.raw`double r = hypot(3.0, 4.0);
printf("%.1f\n", r);`,
    '输出 5.0；比手写 x*x+y*y 更适合极端数值。'
  ),
  isalnum: g(
    '判断字符是否为字母或数字，返回非零表示真。',
    String.raw`if (isalnum((unsigned char)'A')) puts("yes");`,
    '输出 yes；传入 char 前先转为 unsigned char。'
  ),
  isalpha: g(
    '判断字符是否为字母。',
    String.raw`printf("%d %d\n", !!isalpha('x'), !!isalpha('7'));`,
    '输出 `1 0`；它只判断类别，不转换字符。'
  ),
  isdigit: g(
    '判断字符是否为十进制数字 0–9。',
    String.raw`if (isdigit((unsigned char)'7')) puts("digit");`,
    '输出 digit；不要拿它判断整个数字字符串是否合法。'
  ),
  isnan: g(
    '判断浮点值是否为 NaN，返回非零或零。',
    String.raw`double x = 0.0 / 0.0;
if (isnan(x)) puts("not a number");`,
    '输出 not a number（实际代码中应避免制造 NaN）。'
  ),
  isspace: g(
    '判断字符是否为空白，包括空格、换行、制表符等。',
    String.raw`int n = 0;
for (const char *p = "a b\nc"; *p; p++)
    if (isspace((unsigned char)*p)) n++;
printf("%d\n", n);`,
    '输出 2；换行也属于空白。'
  ),
  malloc: g(
    '按字节分配未初始化的堆内存，失败返回 NULL。',
    String.raw`int *p = malloc(5 * sizeof *p);
if (p == NULL) return 1;
p[0] = 10;
printf("%d\n", p[0]);
free(p);`,
    '输出 10；容量按字节计算，使用前先检查 NULL。'
  ),
  mktime: g(
    '把本地日历时间 struct tm 转换为 time_t，并规范化日期字段。',
    String.raw`struct tm t = {0};
t.tm_year = 2024 - 1900;
t.tm_mon = 0;
t.tm_mday = 1;
t.tm_isdst = -1;
time_t stamp = mktime(&t);`,
    '得到 2024-01-01 本地时间对应的时间戳。'
  ),
  pow: g(
    '计算 x 的 y 次幂，参数和返回值都是 double。',
    String.raw`double r = pow(2.0, 10.0);
printf("%.0f\n", r);`,
    '输出 1024；浮点幂可能有舍入误差。'
  ),
  printf: g(
    '按格式串输出数据。格式符必须和参数类型匹配。',
    String.raw`int n = 42;
double x = 3.14159;
printf("n=%d x=%.2f\n", n, x);`,
    '输出 `n=42 x=3.14`；不要把 double 传给 %d。'
  ),
  puts: g(
    '把字符串写到标准输出，并自动追加一个换行。',
    String.raw`puts("hello");`,
    '输出一行 hello；不要再手动给字符串末尾加 \\n。'
  ),
  qsort: g(
    '按比较器对数组排序，需要元素数量、元素大小和比较函数。',
    String.raw`int cmp(const void *a, const void *b) {
    int x = *(const int *)a, y = *(const int *)b;
    return (x > y) - (x < y);
}
int a[] = {3, 1, 2};
qsort(a, 3, sizeof a[0], cmp);`,
    '排序后数组为 {1, 2, 3}；比较器不能返回布尔值。'
  ),
  realloc: g(
    '调整已分配内存块的大小，可能移动地址；失败返回 NULL 且原块仍有效。',
    String.raw`int *p = malloc(2 * sizeof *p);
int *tmp = realloc(p, 4 * sizeof *p);
if (tmp == NULL) {
    free(p);
    return 1;
}
p = tmp;
free(p);`,
    '成功后可安全使用 4 个 int；不要把 realloc 结果直接赋回 p 再判断。'
  ),
  round: g(
    '把浮点数舍入到最接近的整数，遇到 .5 时远离 0。',
    String.raw`printf("%.0f %.0f\n", round(2.5), round(-2.5));`,
    '输出 `3 -3`；返回值仍是浮点类型。'
  ),
  scanf: g(
    '按格式从标准输入读取数据，返回成功赋值的项数。',
    String.raw`int a, b;
if (scanf("%d %d", &a, &b) == 2)
    printf("%d\n", a + b);`,
    '输入 2 3 时输出 5；int 参数必须传地址。'
  ),
  snprintf: g(
    '按格式把文本写入有容量限制的缓冲区，并保证结果以 \\0 结尾。',
    String.raw`char out[8];
int need = snprintf(out, sizeof out, "%s/%s", "tmp", "log");
printf("%d %s\n", need, out);`,
    '输出 `7 tmp/log`；返回值大于等于容量表示发生截断。'
  ),
  sqrt: g(
    '求非负数的平方根，返回 double。',
    String.raw`printf("%.3f\n", sqrt(9.0));`,
    '输出 3.000；负数会进入定义域错误。'
  ),
  strcmp: g(
    '按字典序比较两个以 \\0 结尾的字符串，返回负、零或正数。',
    String.raw`int r = strcmp("apple", "banana");
printf("%s\n", r < 0 ? "before" : "after");`,
    '输出 before；不要假定返回值一定是 -1 或 1。'
  ),
  strcspn: g(
    '返回字符串开头连续不包含 reject 字符的长度，常用于找换行位置。',
    String.raw`char line[] = "hello\n";
line[strcspn(line, "\r\n")] = '\0';
puts(line);`,
    '输出 hello；换行被替换成字符串终止符。'
  ),
  strftime: g(
    '按指定格式把 struct tm 写入有界缓冲区。',
    String.raw`char out[32];
strftime(out, sizeof out, "%Y-%m-%d %H:%M:%S", tm_ptr);
puts(out);`,
    '输出类似 2024-01-01 00:00:00；返回 0 可能表示失败或空结果。'
  ),
  strlen: g(
    '返回字符串从开头到 \\0 之前的字符数，不包含终止符。',
    String.raw`size_t n = strlen("hello");
printf("%zu\n", n);`,
    '输出 5；字符串必须已经以 \\0 结尾。'
  ),
  strncmp: g(
    '只比较两个字符串的前 n 个字符，适合判断前缀或固定长度字段。',
    String.raw`if (strncmp("ERROR: disk", "ERROR", 5) == 0)
    puts("error line");`,
    '输出 error line；n 达到时不会继续读取终止符。'
  ),
  strstr: g(
    '在 haystack 中查找第一次出现的 needle 子串，返回指针或 NULL。',
    String.raw`char text[] = "hello world";
char *p = strstr(text, "world");
if (p) printf("%td\n", p - text);`,
    '输出 6；空模式串会直接返回 haystack。'
  ),
  strtok: g(
    '用一组分隔符把可修改字符串切成若干片段：首次传字符串，之后传 NULL。',
    String.raw`char s[] = "a,b,c";
for (char *p = strtok(s, ","); p; p = strtok(NULL, ","))
    puts(p);`,
    '逐行输出 a、b、c；strtok 会修改原字符串。'
  ),
  strtol: g(
    '按指定进制把字符串转换为 long，并可通过 endptr 和 errno 检查错误。',
    String.raw`char *end = NULL;
errno = 0;
long v = strtol("0x10", &end, 0);
if (errno == 0 && end && *end == '\0') printf("%ld\n", v);`,
    '输出 16；base=0 会自动识别 0x 前缀。'
  ),
  tolower: g(
    '把大写字母转换为小写，非字母通常原样返回。',
    String.raw`char c = (char)tolower('A');
printf("%c\n", c);`,
    '输出 a；它返回新值，不修改原字符。'
  ),
  toupper: g(
    '把小写字母转换为大写，非字母通常原样返回。',
    String.raw`for (const char *p = "abc"; *p; p++)
    putchar(toupper((unsigned char)*p));`,
    '输出 ABC；传入前先转为 unsigned char。'
  ),
  trunc: g(
    '向零方向截断小数部分，返回仍为浮点类型。',
    String.raw`printf("%.0f %.0f\n", trunc(2.9), trunc(-2.9));`,
    '输出 `2 -2`；负数不是向下取整。'
  )
};
