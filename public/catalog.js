// C 标准库高频函数目录。频率分数是教学排序权重，不是语言规范的排名。
const f = (name, signature, summary, task, pitfall, score) => ({ name, signature, summary, task, pitfall, score });

export const modules = [
  {
    id: 'string-core',
    name: '字符串与内存',
    shortName: '字符串',
    header: '<string.h>',
    stage: 1,
    mark: 'S',
    description: '先把最常用的字符串长度、比较、复制、查找与内存移动练成条件反射。',
    outcome: '能安全处理 \\0 终止、目标容量与重叠内存。',
    source: 'ISO C11 §7.24',
    functions: [
      f('strlen', 'size_t strlen(const char *s)', '返回从 s 到第一个 \\0 之前的字符数。', '求以 \\0 结尾字符串的字符数', '不包含结尾 \\0；若字符串未终止，会越界读取。', 100),
      f('strcmp', 'int strcmp(const char *s1, const char *s2)', '按字符编码顺序比较两个字符串。', '判断两个字符串的字典序关系', '返回值只需区分为负、零、正，不能假定一定是 -1 或 1。', 98),
      f('strcpy', 'char *strcpy(char *dest, const char *src)', '把 src 连同结尾 \\0 复制到 dest。', '把已知能放下的字符串完整复制到目标缓冲区', '不检查容量；目标必须可写且至少能容纳 strlen(src)+1 个字节。', 96),
      f('strncpy', 'char *strncpy(char *dest, const char *src, size_t n)', '最多复制 n 个字符，不足时用 \\0 填充。', '从定长源字段复制最多 n 个字节', '源字符串长度达到 n 时结果可能没有 \\0 终止符。', 92),
      f('strcat', 'char *strcat(char *dest, const char *src)', '把 src 追加到 dest 的结尾 \\0 之后。', '在有效目标字符串末尾追加另一段文本', '不检查剩余容量；dest 必须有足够空间并保持 \\0 终止。', 90),
      f('strncat', 'char *strncat(char *dest, const char *src, size_t n)', '最多追加 n 个源字符，并写入结尾 \\0。', '限制追加字符数的字符串拼接', 'n 限制的是追加字符，不含自动写入的 \\0；目标仍需为终止符留空间。', 72),
      f('strchr', 'char *strchr(const char *s, int c)', '查找字符 c 在字符串中第一次出现的位置。', '寻找字符串中某个字符第一次出现的位置', '找不到时返回 NULL；查找 \\0 会返回指向终止符的位置。', 88),
      f('strrchr', 'char *strrchr(const char *s, int c)', '查找字符 c 在字符串中最后一次出现的位置。', '寻找字符串中某个字符最后一次出现的位置', '找不到时返回 NULL；常用来定位文件扩展名或路径分隔符。', 75),
      f('strstr', 'char *strstr(const char *haystack, const char *needle)', '查找 needle 在 haystack 中第一次出现的子串。', '在长文本中定位一段子串', 'needle 为空字符串时返回 haystack；调用方仍需处理 NULL 结果。', 87),
      f('strtok', 'char *strtok(char *s, const char *delim)', '用分隔符集合切分字符串，首次传 s，后续传 NULL。', '按一组分隔符连续切分一段可修改字符串', '会修改原字符串且使用内部状态，不可重入，也不适合并发或嵌套切分。', 84),
      f('strncmp', 'int strncmp(const char *s1, const char *s2, size_t n)', '最多比较 n 个字符的字典序。', '只比较两个字符串的前 n 个字符', '达到 n 即停止，不保证读取到任一字符串的终止符。', 86),
      f('memcpy', 'void *memcpy(void *dest, const void *src, size_t n)', '复制 n 个字节，要求源和目标不重叠。', '复制一段明确长度且互不重叠的原始字节', '源与目标内存重叠时行为未定义。', 93),
      f('memmove', 'void *memmove(void *dest, const void *src, size_t n)', '复制 n 个字节，允许源和目标重叠。', '在可能有重叠的内存区域之间移动字节', 'n 以字节计，不是元素个数；目标仍需至少 n 字节。', 79),
      f('memset', 'void *memset(void *s, int c, size_t n)', '把 s 起始的 n 个字节全部设置为 c 的低 8 位。', '把一段内存按字节初始化为同一个值', '按字节写入；不要用它把 int 数组设置为 1，也不能据此得到任意非零整数值。', 89),
      f('memcmp', 'int memcmp(const void *s1, const void *s2, size_t n)', '比较两块内存的前 n 个字节。', '比较两段固定长度原始字节的内容', '按无符号字节比较；对含填充字节的结构体比较结果可能不稳定。', 70),
      f('strspn', 'size_t strspn(const char *s, const char *accept)', '返回 s 开头连续属于 accept 字符集的长度。', '统计字符串开头连续属于指定字符集的部分', '返回的是开头匹配跨度，不是整个字符串中属于字符集的总数。', 55),
      f('strcspn', 'size_t strcspn(const char *s, const char *reject)', '返回 s 开头连续不属于 reject 字符集的长度。', '寻找字符串开头连续避开指定字符集的长度', '遇到 reject 中任一字符立即停止；常与换行符配合去除行尾。', 53),
      f('strpbrk', 'char *strpbrk(const char *s, const char *accept)', '返回 s 中第一个属于 accept 任一字符的位置。', '查找字符串中第一次出现任一候选字符的位置', '它匹配字符集中的任意一个字符，而不是整个 accept 子串。', 50),
      f('strerror', 'char *strerror(int errnum)', '返回错误码对应的可读说明字符串。', '把 errno 之类的错误码转换为可读说明', '返回文本可能受区域设置影响，也可能被后续调用改写；不要修改返回缓冲区。', 65),
      f('strcoll', 'int strcoll(const char *s1, const char *s2)', '按当前区域设置的排序规则比较字符串。', '按当前语言环境规则比较两个字符串', '结果依赖 setlocale 设置的 LC_COLLATE，不等同于 strcmp 的字节序比较。', 30),
      f('strxfrm', 'size_t strxfrm(char *dest, const char *src, size_t n)', '把字符串转换为当前区域设置下可比较的排序键。', '生成可反复用于区域感知排序的字符串键', '返回所需的完整键长度，可能大于 n；目标被截断时内容不足以完整比较。', 28)
    ]
  },
  {
    id: 'ctype',
    name: '字符分类与转换',
    shortName: '字符',
    header: '<ctype.h>',
    stage: 2,
    mark: 'C',
    description: '用分类函数准确识别字母、数字、空白、标点，并正确转换大小写。',
    outcome: '能写出去重、分词、清洗和格式规范化逻辑。',
    source: 'ISO C11 §7.4',
    functions: [
      f('isdigit', 'int isdigit(int c)', '判断 c 是否为十进制数字 0 到 9。', '判断一个字符是否属于十进制数字', '只识别 0-9；传参时先把 char 转为 unsigned char，或直接使用 EOF。', 91),
      f('isalpha', 'int isalpha(int c)', '判断 c 是否为当前区域设置中的字母。', '判断一个字符是否为字母', '不要直接传负值 char，应先转换为 unsigned char 再传入。', 89),
      f('isspace', 'int isspace(int c)', '判断 c 是否为空白字符。', '判断字符是否属于空白类别', '除空格外的换行、制表等也属于空白；结果可能受区域设置影响。', 86),
      f('isalnum', 'int isalnum(int c)', '判断 c 是否为字母或十进制数字。', '判断字符是否属于字母或数字', '返回的是非零/零，不保证非零值恰好为 1；不要直接依赖数值大小。', 82),
      f('toupper', 'int toupper(int c)', '在可转换时返回 c 的大写形式，否则原样返回。', '把一个小写字母字符转换为大写', '它返回 int 且不修改原对象；参数必须能表示为 unsigned char 或 EOF。', 85),
      f('tolower', 'int tolower(int c)', '在可转换时返回 c 的小写形式，否则原样返回。', '把一个大写字母字符转换为小写', '它不原地修改字符；对非字母输入通常原样返回，但仍需正确传参。', 84),
      f('isupper', 'int isupper(int c)', '判断 c 是否为当前区域设置中的大写字母。', '判断一个字符是否为大写字母', '仅判断类别，不会转换大小写；不要用它替代 toupper。', 72),
      f('islower', 'int islower(int c)', '判断 c 是否为当前区域设置中的小写字母。', '判断一个字符是否为小写字母', '标点、数字和空白都不属于小写字母。', 72),
      f('ispunct', 'int ispunct(int c)', '判断 c 是否为标点字符。', '判断一个字符是否属于标点类别', '连字符、下划线等是否属于标点由区域设置决定；不应硬编码 ASCII 范围。', 47),
      f('isprint', 'int isprint(int c)', '判断 c 是否为可打印字符，包含空格。', '判断一个字符是否可打印且包含空格', '它包含空格；如果目标是排除空格，应使用 isgraph。', 44),
      f('isgraph', 'int isgraph(int c)', '判断 c 是否为有图形表示的字符，不含空格。', '判断一个字符是否可见且不是空格', '与 isprint 的关键差别是空格会被排除。', 30),
      f('isxdigit', 'int isxdigit(int c)', '判断 c 是否为十六进制数字。', '判断字符是否为 0-9、a-f 或 A-F', '只判断字符类别，不校验完整的十六进制数字串格式。', 40),
      f('iscntrl', 'int iscntrl(int c)', '判断 c 是否为控制字符。', '判断一个字符是否属于控制字符', '换行、制表、退格等都可能属于控制字符；空白并不等同于控制字符。', 35),
      f('isblank', 'int isblank(int c)', '判断 c 是否为空格或水平制表符。', '判断字符是否为空格或水平制表符', 'isblank 只覆盖水平空白，范围比 isspace 更窄。', 50)
    ]
  },
  {
    id: 'math-numeric',
    name: '数学与数值',
    shortName: '数学',
    header: '<math.h>',
    stage: 3,
    mark: 'M',
    description: '覆盖幂、根、取整、三角、对数与浮点分类，并建立浮点误差意识。',
    outcome: '能处理定义域、精度、舍入方向和 NaN/Inf。',
    source: 'ISO C11 §7.12',
    functions: [
      f('sqrt', 'double sqrt(double x)', '返回 x 的非负平方根。', '计算非负实数的平方根', 'x 为负数时会触发定义域错误；结果通常是 NaN，必须显式检查输入或结果。', 94),
      f('fabs', 'double fabs(double x)', '返回浮点数 x 的绝对值。', '计算浮点数的绝对值', '整数绝对值应使用 abs/labs/llabs；不要期待 fabs 修改参数本身。', 93),
      f('pow', 'double pow(double x, double y)', '计算 x 的 y 次幂。', '计算一般实数幂', '定义域与边界组合复杂，可能产生无穷大或 NaN；不要用 pow 做整数平方的替代而不考虑精度。', 90),
      f('fmod', 'double fmod(double x, double y)', '计算 x 除以 y 的浮点余数，符号与 x 一致。', '计算保留被除数符号的浮点余数', 'y 为 0 时结果未定义；它不同于始终非负的数学模运算。', 78),
      f('round', 'double round(double x)', '把 x 舍入到最接近的整数，半值远离 0。', '按半值远离零规则把浮点数舍入为整数值', 'round 返回的仍是浮点类型，且 .5 的舍入方向与 floor/trunc 不同。', 82),
      f('floor', 'double floor(double x)', '返回不大于 x 的最大整数值。', '把浮点数向下舍入到整数值', '向前是朝负无穷方向；floor(-1.2) 是 -2.0。', 84),
      f('ceil', 'double ceil(double x)', '返回不小于 x 的最小整数值。', '把浮点数向上舍入到整数值', '向上是朝正无穷方向；ceil(-1.2) 是 -1.0。', 82),
      f('trunc', 'double trunc(double x)', '向零截断小数部分。', '直接丢弃浮点数的小数部分', '负数向零舍入，例如 trunc(-1.9) 是 -1.0，不等同于 floor。', 60),
      f('fmin', 'double fmin(double x, double y)', '返回两个浮点数中较小的一个。', '在两个浮点数中取较小值', 'NaN 参数处理与普通 < 比较并不完全相同，应确认题目对 NaN 的约定。', 68),
      f('fmax', 'double fmax(double x, double y)', '返回两个浮点数中较大的一个。', '在两个浮点数中取较大值', '不要把 fmax 与接受任意参数个数的宏混淆；它是两个参数的函数。', 68),
      f('log', 'double log(double x)', '返回 x 的自然对数。', '计算自然对数', 'x 小于等于 0 时定义域无效；x 接近 1 时直接相减可能损失精度。', 72),
      f('log10', 'double log10(double x)', '返回 x 的以 10 为底对数。', '计算以 10 为底的对数', '只能处理正数；整数位数统计等场景要小心边界和浮点误差。', 65),
      f('log2', 'double log2(double x)', '返回 x 的以 2 为底对数。', '计算以 2 为底的对数', '适合位宽或二分深度分析，但输入必须为正数。', 60),
      f('exp', 'double exp(double x)', '返回 e 的 x 次幂。', '计算自然指数函数', 'x 很大时可能溢出为无穷大，应检查 errno 或 isfinite。', 63),
      f('sin', 'double sin(double x)', '返回弧度 x 的正弦值。', '计算给定弧度的正弦值', '参数单位是弧度；直接把角度传入会得到错误结果。', 58),
      f('cos', 'double cos(double x)', '返回弧度 x 的余弦值。', '计算给定弧度的余弦值', '参数单位是弧度；周期化简时要注意大角度精度。', 58),
      f('tan', 'double tan(double x)', '返回弧度 x 的正切值。', '计算给定弧度的正切值', '接近 pi/2 的倍数时数值不稳定，不要把浮点结果当作精确奇点。', 50),
      f('atan2', 'double atan2(double y, double x)', '根据 y 和 x 的符号返回方位角，范围为 [-pi, pi]。', '根据二维坐标计算带象限的方位角', '参数顺序是 y 在前、x 在后；交换参数会改变象限。', 55),
      f('hypot', 'double hypot(double x, double y)', '返回 sqrt(x²+y²)，并尽量避免中间溢出。', '安全计算二维向量长度', '不要自己写 x*x+y*y 处理极端大小时，hypot 的中间计算更稳健。', 52),
      f('isnan', 'int isnan(real-floating x)', '判断浮点值是否为 NaN，返回非零或零。', '判断浮点结果是否为 NaN', '非零结果不保证恰好为 1；不要用它对整数调用。', 74),
      f('isinf', 'int isinf(real-floating x)', '判断浮点值是否为正负无穷。', '判断浮点值是否为正负无穷', 'isinf 对正负无穷都返回非零；若需要方向要再比较符号。', 58),
      f('isfinite', 'int isfinite(real-floating x)', '判断浮点值是否既非 NaN 也非无穷。', '判断浮点值是否为有限数', '有限不代表业务值合理；仍可能超出可接受范围。', 52),
      f('cbrt', 'double cbrt(double x)', '返回 x 的实数立方根。', '计算可能为负数的实数立方根', '不要用 pow(x, 1.0/3.0) 处理负数来代替 cbrt。', 35),
      f('lround', 'long lround(double x)', '把浮点值按半值远离零规则舍入为 long。', '将浮点数舍入并转换为长整数', '结果超出 long 范围或为 NaN/无穷时行为未定义或由实现定义，必须先检查。', 45),
      f('fma', 'double fma(double x, double y, double z)', '计算 x*y+z，并只进行一次最终舍入。', '需要融合乘加精度的数值计算', '不要假定所有平台都能比分开乘法加法得到完全相同的结果。', 28)
    ]
  },
  {
    id: 'stdlib-core',
    name: '转换、内存与算法',
    shortName: 'stdlib',
    header: '<stdlib.h>',
    stage: 4,
    mark: 'A',
    description: '掌握可验证的数值解析、动态内存生命周期、排序查找与伪随机数。',
    outcome: '能写出可释放、可检查错误、比较器正确的程序。',
    source: 'ISO C11 §7.22',
    functions: [
      f('atoi', 'int atoi(const char *nptr)', '把字符串前缀解析为 int，但无法报告溢出细节。', '快速把简单十进制字符串转换为 int', '无法区分非法输入与合法 0，溢出行为也不适合严谨场景；应优先考虑 strtol。', 88),
      f('atol', 'long atol(const char *nptr)', '把字符串前缀解析为 long。', '快速把简单十进制字符串转换为 long', '同样缺乏可靠的错误报告，不能替代 strtol 的 endptr 与 errno 检查。', 48),
      f('strtol', 'long strtol(const char *nptr, char **endptr, int base)', '带基数解析长整数，并通过 endptr 和 errno 暴露错误。', '严谨解析整数并判断非法字符或溢出', '必须检查 endptr 是否前进以及 errno 是否被设为 ERANGE，不能只看返回值。', 80),
      f('strtoul', 'unsigned long strtoul(const char *nptr, char **endptr, int base)', '解析无符号长整数，并允许负数文本按模转换。', '解析无符号整数或带进制前缀的数值', '前导负号可能被转换为很大的无符号值，需结合业务语义校验。', 55),
      f('strtod', 'double strtod(const char *nptr, char **endptr)', '把字符串解析为 double，并报告范围错误。', '严谨解析浮点数并检测尾随字符', '解析成功也不代表值有限；应同时检查 errno 和 isfinite。', 68),
      f('malloc', 'void *malloc(size_t size)', '分配至少 size 字节、未初始化的动态内存。', '按运行期大小分配一块未初始化的堆内存', '返回值可能为 NULL；容量按字节计算，分配后内容未定义。', 97),
      f('calloc', 'void *calloc(size_t nmemb, size_t size)', '分配 nmemb*size 字节并全部置零。', '分配元素数组并初始化为全零', '乘法溢出可能使看似合理的参数失败；始终检查返回值。', 82),
      f('realloc', 'void *realloc(void *ptr, size_t size)', '调整已分配内存块大小，可能移动地址。', '扩容或缩小已有动态数组', '必须先把返回值存入临时指针；失败时原指针仍然有效，不能直接覆盖丢失。', 78),
      f('free', 'void free(void *ptr)', '释放动态分配的内存；传入 NULL 是安全的。', '结束一块堆内存的生命周期', '不能重复释放、释放非堆指针或继续访问已释放内存。', 97),
      f('qsort', 'void qsort(void *base, size_t nmemb, size_t size, int (*compar)(const void *, const void *))', '对任意元素数组进行快速排序式排序。', '对数组按自定义比较器排序', '比较器必须满足严格弱序，避免用相减结果直接比较可能溢出的整数。', 84),
      f('bsearch', 'void *bsearch(const void *key, const void *base, size_t nmemb, size_t size, int (*compar)(const void *, const void *))', '在已排序数组中二分查找元素。', '在有序数组中查找与 key 匹配的元素', '数组必须已按同一比较器排序；找不到时返回 NULL。', 56),
      f('rand', 'int rand(void)', '返回 0 到 RAND_MAX 之间的伪随机整数。', '生成可复现的伪随机序列', '质量和范围依赖实现；不要用 rand()%n 代替对偏差敏感的高质量随机分布。', 65),
      f('srand', 'void srand(unsigned int seed)', '设置 rand 使用的伪随机序列种子。', '初始化可复现的伪随机数序列', '通常进程只播种一次；循环内反复按时间播种可能得到重复序列。', 62),
      f('abs', 'int abs(int j)', '返回 int 的绝对值。', '计算 int 类型的绝对值', '对 INT_MIN 取绝对值会溢出；需要更宽范围时使用 llabs 并检查边界。', 78),
      f('labs', 'long labs(long j)', '返回 long 的绝对值。', '计算 long 类型的绝对值', 'LONG_MIN 无法表示为正的 long，因此不可对其求绝对值。', 45),
      f('llabs', 'long long llabs(long long j)', '返回 long long 的绝对值。', '计算 long long 类型的绝对值', 'LLONG_MIN 的绝对值超出 long long 可表示范围。', 40),
      f('div', 'div_t div(int numer, int denom)', '一次返回整数除法的商和余数。', '一次取得 int 除法的商和余数', '除数为 0 仍然无效；部分实现中商向零截断，余数符号与被除数一致。', 32),
      f('ldiv', 'ldiv_t ldiv(long numer, long denom)', '一次返回 long 除法的商和余数。', '一次取得 long 除法的商和余数', '不能处理除数为 0；结果字段名是 quot 和 rem。', 25),
      f('getenv', 'char *getenv(const char *name)', '读取当前进程环境变量的值；不存在时返回 NULL。', '读取进程环境变量并决定可选配置', '返回字符串属于环境存储，调用方不应修改；后续环境变更也可能使指针失效。', 58),
      f('exit', 'void exit(int status)', '正常终止进程，刷新并关闭标准 I/O 流。', '在程序入口之外正常结束进程并返回状态码', '会执行已注册的清理逻辑；不要用它替代库函数中的普通返回错误。', 61)
    ]
  },
  {
    id: 'stdio-core',
    name: '输入输出与文件',
    shortName: 'I/O',
    header: '<stdio.h>',
    stage: 5,
    mark: 'I',
    description: '从格式化输出、可靠读行，到文件打开、定位和二进制读写，形成完整 I/O 链。',
    outcome: '能处理截断、换行、EOF、文件模式与部分读写。',
    source: 'ISO C11 §7.21',
    functions: [
      f('printf', 'int printf(const char *format, ...)', '按格式把文本写到标准输出。', '按格式向标准输出打印文本与数据', '格式说明必须与实际参数类型匹配；不匹配会导致未定义行为。', 100),
      f('scanf', 'int scanf(const char *format, ...)', '按格式从标准输入读取数据。', '从标准输入按格式读取并转换数据', '%s 不限制长度且会越界；读取字符串时应使用带宽度限制的方案或 fgets。', 92),
      f('snprintf', 'int snprintf(char *s, size_t n, const char *format, ...)', '有界格式化输出，最多写入 n-1 个字符并追加 \\0。', '安全地按格式写入有容量限制的缓冲区', '返回若空间足够本应写入的字符数；返回值大于等于 n 表示发生截断。', 91),
      f('fprintf', 'int fprintf(FILE *stream, const char *format, ...)', '按格式向指定文件流输出。', '向文件或错误流按格式写入文本', '返回值可能小于预期且为负表示错误；关闭或刷新时也要检查 I/O 错误。', 84),
      f('fopen', 'FILE *fopen(const char *filename, const char *mode)', '按指定模式打开文件，失败返回 NULL。', '打开文件并获得用于后续 I/O 的 FILE 流', '模式错误或权限不足会返回 NULL；文本模式下的换行转换依平台而异。', 90),
      f('fclose', 'int fclose(FILE *stream)', '刷新并关闭文件流，失败返回 EOF。', '结束文件流并释放关联资源', '关闭后不能继续使用该 FILE 指针；对空指针调用是未定义行为。', 90),
      f('fgets', 'char *fgets(char *s, int n, FILE *stream)', '最多读取 n-1 个字符，保留换行并追加 \\0。', '从文件流安全读取一整行并限制缓冲长度', '未读完整行时剩余内容仍留在流中；返回 NULL 需结合 feof/ferror 判断原因。', 93),
      f('sscanf', 'int sscanf(const char *s, const char *format, ...)', '从已有字符串按格式解析数据。', '从内存中的字符串解析结构化字段', '返回值是成功赋值项数；不要只检查是否等于 EOF。', 76),
      f('sprintf', 'int sprintf(char *s, const char *format, ...)', '无界格式化并写入字符串缓冲区。', '在缓冲区容量绝对充足时格式化到字符串', '不检查目标容量，容易缓冲区溢出；优先使用 snprintf。', 73),
      f('puts', 'int puts(const char *s)', '把字符串写到标准输出并自动追加换行。', '向标准输出打印一行简单文本并自动换行', '会自动添加换行；不要与已经带换行的文本重复叠加换行。', 80),
      f('fputs', 'int fputs(const char *s, FILE *stream)', '把字符串写到指定流，不自动添加换行。', '向文件流写入字符串且保留原始换行控制', '不自动追加换行，也可能只写入部分内容，应检查返回值。', 64),
      f('fgetc', 'int fgetc(FILE *stream)', '从流读取一个 unsigned char 并转换为 int，失败返回 EOF。', '逐字符读取文件内容', '必须用 int 接收；char 可能无法区分合法字节与 EOF。', 72),
      f('getchar', 'int getchar(void)', '从标准输入读取一个字符，等价于 fgetc(stdin)。', '逐字符处理标准输入', '返回值是 int；不要用 char 接收，否则 EOF 判断可能失效。', 70),
      f('fputc', 'int fputc(int c, FILE *stream)', '向流写入一个字符，失败返回 EOF。', '逐字符写入文件或输出流', '写入成功返回字符值，失败返回 EOF；不要把返回 EOF 当作普通字节。', 63),
      f('fflush', 'int fflush(FILE *stream)', '刷新输出流的缓冲区；对输入流的语义有额外限制。', '在关键节点把标准输出缓冲区内容送出', '对普通输入流调用 fflush 行为未定义；NULL 也只刷新输出流。', 68),
      f('fread', 'size_t fread(void *ptr, size_t size, size_t nmemb, FILE *stream)', '从流读取最多 nmemb 个元素。', '从二进制文件批量读取固定大小记录', '返回元素数量而非字节数；短读可能由 EOF 或错误造成。', 66),
      f('fwrite', 'size_t fwrite(const void *ptr, size_t size, size_t nmemb, FILE *stream)', '向流写入 nmemb 个元素。', '向二进制文件批量写入固定大小记录', '返回值是成功写入的元素数；应检查是否等于请求数量。', 66),
      f('fseek', 'int fseek(FILE *stream, long offset, int whence)', '设置文件位置指示器。', '在可定位文件中跳转到指定字节偏移', '只保证对二进制文件支持 seek 到任意位置；文本文件定位规则更受限。', 62),
      f('ftell', 'long ftell(FILE *stream)', '返回当前文件位置，失败返回 -1L。', '取得当前文件位置或文件长度', '结果类型是 long，可能不足以表示超大文件；需与 fseek 错误检查配合。', 60),
      f('feof', 'int feof(FILE *stream)', '判断流是否已设置 EOF 指示器。', '在一次读取失败后区分是否到达文件尾', '只有读取尝试越过后才会设置 EOF；不能用它提前预测下一次读取。', 73),
      f('ferror', 'int ferror(FILE *stream)', '判断流是否设置了错误指示器。', '在一次 I/O 失败后判断是否发生流错误', '错误指示器不会自动清除；需要显式 clearerr 后才会重置。', 52),
      f('perror', 'void perror(const char *s)', '根据 errno 向标准错误输出错误说明。', '在系统调用或库调用失败后输出可读错误', '应紧跟失败操作调用，因为后续库调用可能改变 errno。', 55),
      f('remove', 'int remove(const char *filename)', '删除指定文件。', '删除一个文件名对应的文件', '失败返回非零且设置 errno；不能只凭返回值判断是权限、路径还是占用问题。', 49),
      f('rename', 'int rename(const char *oldname, const char *newname)', '重命名或移动同一文件系统内的文件。', '把文件重命名或移动到新路径', '跨文件系统或目标已存在的规则因平台而异；必须检查返回值。', 45),
      f('rewind', 'void rewind(FILE *stream)', '把位置重置到文件开头，并清除错误指示器。', '重新开始读取一个已经部分读取的文件', '它不返回失败状态；需要可诊断的定位时优先使用 fseek。', 48)
    ]
  },
  {
    id: 'time-core',
    name: '时间与耗时',
    shortName: '时间',
    header: '<time.h>',
    stage: 6,
    mark: 'T',
    description: '理解日历时间、本地时间、UTC、格式化与单调耗时的边界。',
    outcome: '能正确记录时间、计算差值并生成稳定时间戳。',
    source: 'ISO C11 §7.27',
    functions: [
      f('time', 'time_t time(time_t *timer)', '返回当前日历时间；也可通过非空指针写回。', '取得当前日历时间的时间戳', '失败时返回 (time_t)-1；time_t 的范围与底层类型由实现决定。', 88),
      f('clock', 'clock_t clock(void)', '返回程序使用的处理器时间近似值。', '测量当前进程消耗的处理器时间', '不是墙上时钟；跨进程或等待 I/O 的时间可能不反映在结果里。', 70),
      f('difftime', 'double difftime(time_t time1, time_t time0)', '返回 time1 - time0 的秒数。', '计算两个日历时间之间相差的秒数', '参数顺序决定正负；不要直接用整数相减替代可移植的 difftime。', 68),
      f('localtime', 'struct tm *localtime(const time_t *timer)', '把 time_t 转换为本地日历时间。', '把时间戳转换为本地日期时间', '返回指向静态存储的指针，后续调用可能覆盖；结果受时区和夏令时影响。', 74),
      f('gmtime', 'struct tm *gmtime(const time_t *timer)', '把 time_t 转换为 UTC 日历时间。', '把时间戳转换为 UTC 日期时间', '返回静态存储，不能假定长期有效；与 localtime 的时区语义不同。', 65),
      f('mktime', 'time_t mktime(struct tm *timeptr)', '把本地日历时间转换为 time_t，并规范化字段。', '把本地日期时间字段转换为时间戳', '会修改传入结构并规范化越界字段；失败返回 (time_t)-1，且可能与合法时间 -1 冲突。', 60),
      f('strftime', 'size_t strftime(char *s, size_t maxsize, const char *format, const struct tm *timeptr)', '按格式把日历时间写入有界缓冲区。', '把 struct tm 格式化为可读时间字符串', '返回 0 可能表示空结果或缓冲区不足，不能单独据此区分原因。', 72),
      f('asctime', 'char *asctime(const struct tm *timeptr)', '把日历时间转换成固定风格字符串。', '快速生成便于调试的日历时间文本', '返回静态缓冲区、格式固定且带换行；不适合正式本地化和并发代码。', 37)
    ]
  }
];

// 全局频率排名：越高越先练，同分时保持目录中的先后顺序。
const sorted = modules
  .flatMap((module) => module.functions.map((item, index) => ({ module, item, index })))
  .sort((a, b) => b.item.score - a.item.score || a.index - b.index);

sorted.forEach(({ module, item }, index) => {
  item.rank = index + 1;
  item.id = `${module.id}-${item.name}`;
  item.moduleId = module.id;
  item.moduleName = module.name;
  item.header = module.header;
  item.frequency = item.score >= 90 ? '极高' : item.score >= 78 ? '高' : item.score >= 60 ? '中' : '进阶';
});

export const allFunctions = sorted.map(({ item }) => item);

export const functionById = new Map(allFunctions.map((item) => [item.id, item]));

export const moduleById = new Map(modules.map((module) => [module.id, module]));

export const sources = [
  {
    label: 'ISO/IEC 9899:2018',
    note: 'C17 标准中的库函数语义、约束与未定义行为。',
    url: 'https://www.iso.org/standard/74528.html'
  },
  {
    label: 'cppreference / C',
    note: '逐函数原型、版本差异与边界条件速查。',
    url: 'https://en.cppreference.com/w/c'
  },
  {
    label: 'GNU C Library Manual',
    note: 'glibc 实现细节、扩展与平台差异参考。',
    url: 'https://www.gnu.org/software/libc/manual/'
  },
  {
    label: 'TheAlgorithms/C',
    note: '开源算法实现对照，用于理解常见工程写法。',
    url: 'https://github.com/TheAlgorithms/C'
  },
  {
    label: 'Exercism C Track',
    note: '开源练习设计与测试驱动学习参考。',
    url: 'https://github.com/exercism/c'
  }
];

