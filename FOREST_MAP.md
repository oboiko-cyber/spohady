# Коротка карта оригінального коду лісу (для економії токенів)
**Оригінал:** `sources/zablukannia.original.html` (~59 KB). Це **vanilla JS + Canvas 2D**, а не p5.js. Спочатку використай `rg`/`grep` для потрібних функцій, а не копіюй у чат весь файл.

## DOM
- `#artCanvas` — повноекранний canvas; `const canvas`, `ctx`, `let width,height`.
- `#audioBtn`, `#audioText`, `#audioIconOn`, `#audioIconOff` — звук (початково вимк.).
- `#askAiBtn`, `#aiModal`, `#aiQueryInput`, `#submitAiQuery`, `#aiChatHistory` — оригінальний Gemini-чат. У MVP замінити на **локальний демо-помічник** без зовнішніх викликів та чесно це підписати.
- `#conceptBtn`, `#conceptModal`, `#closeModalBtn` — оригінальне модальне вікно концепції, можна адаптувати для «Про виставку».
- `#lightBar`, `#lightStatusLabel`, `#shadowStatusMsg` — індикатори стану світла/тіні.
- `#instructionMain`, `#instructionSub`, `#instructionSpace` — керування внизу екрана.
- В оригіналі є Tailwind CDN і шрифти Google; не перекроювати художній стиль при MVP.

## Стан і параметри
- `mouse = { x,y,targetX,targetY,isMoving }` — ціль керування **в координатах екрана** в оригіналі.
- `rabbit = {x,y,angle,speed:0.05,lightLevel:1.0,transformationProgress,isTransformed,...}` — персонаж.
- `reigniteCount = 0`, `AWAKEN_THRESHOLD = 5`, `baseDecayRate = 0.0006`, `currentDecayRate`, `decayAcceleration = 1.35` — авторська система втрати/повернення ліхтаря.
- `droppedLantern = {x,y,active,pickupRadius:35}`; `alterEgo` — друга сутність.
- `isForestAwakened`, `forestAwakenTransition` і `forestFireflies` — оригінальне оживання після п'яти повернень.
- `isGamePaused`, `animationFrameId` — стан анімації.
- `trees`, `paths`, `ambientFog`, `glowingEyes`, `footstepParticles` — середовище.

## Функції / точки входу
- `class Tree` + `.draw(ctx,rabbitX,rabbitY,lightPower)` — лісові дерева; залежить від `forestAwakenTransition`.
- `class LabyrinthPath` + `.generatePoints()`/`.draw(...)` — декоративні випадкові пунктирні стежки (`ctx.setLineDash([8,12])`). Потрібна адаптація до світу з природними звивистими стежками, не додаткова карта поверх.
- `initScene()` — наразі генерує світ у межах `width × height`; викликається також після resize, що заново створює геометрію.
- `drawRabbit`, `drawAlterEgo`, `drawDroppedLantern` — рендеринг головних персонажів, зберігати логіку/характер.
- `animate()` — основний RAF-цикл: фон, виснаження, світло/тінь, пересування зайченяти за курсором, туман, стежки, дерева, персонаж, наступний кадр.
- `pauseGame()` / `resumeGame()` — використати для модалок, але перевірити, що після багаторазового відкриття не запускається декілька циклів одночасно.
- `reigniteLight(fromDroppedLantern=false)` — відновлення ліхтарика; `fromDroppedLantern=true` збільшує `reigniteCount`, і після п'яти оживає ліс.
- `dropLanternInWoods()` — зараз розміщує ліхтарик випадково в екранних координатах; перевести в координати світу.
- `buildSystemPrompt()`, `fetchGeminiWhisper()`, `triggerAiForestWhisper()` — зараз клієнтський запит до Gemini із порожнім `apiKey`; **вимкнути зовнішній fetch у робочій копії**. Не вигадувати справжню ШІ-функцію.
- `window.addEventListener('mousemove'|'touchmove'|'mousedown'|'mouseup'|'keydown'|'resize',...)` — обробники; не дозволити модальним кнопкам впливати на рух зайченяти.

## Архітектурні ризики, які треба врахувати
1. У вихіднику **світ і екран мають ті самі координати**. Щоб зробити великий ліс, введи координати світу й камери, а для курсора — screen→world. Не перемальовуй зайченя з нуля.
2. `initScene()` зараз рандомізує стежки й дерева на resize. У MVP дев'ять знаходок повинні мати стабільні позиції, які не розбігаються після зміни розміру вікна.
3. Якщо просто збільшити площу світу й кількість дерев у кілька разів, Canvas може гальмувати. Обмежуй кількість / малюй лише видиме, але збережи візуальний характер.
4. `animate()` зменшує `lightLevel` лише коли ігровий цикл активний і мишу не утримують. Пауза на читання має зупиняти і світло, і рух; після закриття продовжувати без стрибка курсора.
5. Оригінал робить зовнішні Gemini-виклики при зміні стану й у вікні чату; в MVP їх **не повинно бути в Network**.
6. Вихідний концептуальний HUD має назву «Заблукання», а вся виставка називається «Спогади». Підпис авторства лісу зберегти; у головній навігації виставки — «Спогади».
