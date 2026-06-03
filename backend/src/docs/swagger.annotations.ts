/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     description: Create a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: Password123!
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login user
 *     description: Authenticate user and receive JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user
 *     description: Retrieve authenticated user information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/concepts:
 *   get:
 *     tags: [Concepts]
 *     summary: Get all concepts
 *     description: Retrieve paginated list of concepts with filtering options
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title or description
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by tags
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         description: Filter by difficulty
 *       - in: query
 *         name: minConfidence
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *         description: Minimum confidence score
 *       - in: query
 *         name: maxConfidence
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *         description: Maximum confidence score
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, confidenceScore, title]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Concepts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     concepts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Concept'
 *                     total:
 *                       type: number
 *                     page:
 *                       type: number
 *                     pages:
 *                       type: number
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/concepts:
 *   post:
 *     tags: [Concepts]
 *     summary: Create a new concept
 *     description: Create a new learning concept
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 example: Binary Search Algorithm
 *               description:
 *                 type: string
 *                 example: An efficient algorithm for finding an item in a sorted array
 *               notes:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [algorithms, searching, computer-science]
 *               difficulty:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 default: intermediate
 *               sourceId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Concept created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     concept:
 *                       $ref: '#/components/schemas/Concept'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/concepts/{id}:
 *   get:
 *     tags: [Concepts]
 *     summary: Get concept by ID
 *     description: Retrieve a single concept
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Concept ID
 *     responses:
 *       200:
 *         description: Concept retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     concept:
 *                       $ref: '#/components/schemas/Concept'
 *       404:
 *         description: Concept not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/concepts/{id}:
 *   put:
 *     tags: [Concepts]
 *     summary: Update concept
 *     description: Update an existing concept
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               notes:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               difficulty:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *     responses:
 *       200:
 *         description: Concept updated successfully
 *       404:
 *         description: Concept not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/concepts/{id}:
 *   delete:
 *     tags: [Concepts]
 *     summary: Delete concept
 *     description: Delete a concept
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Concept deleted successfully
 *       404:
 *         description: Concept not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/concepts/{id}/review:
 *   post:
 *     tags: [Concepts]
 *     summary: Record concept review
 *     description: Record a spaced repetition review and update confidence score
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - performance
 *             properties:
 *               performance:
 *                 type: string
 *                 enum: [perfect, good, struggled, failed]
 *                 example: good
 *                 description: How well the user recalled the concept
 *     responses:
 *       200:
 *         description: Review recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     concept:
 *                       $ref: '#/components/schemas/Concept'
 *       404:
 *         description: Concept not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/sources:
 *   get:
 *     tags: [Sources]
 *     summary: Get all sources
 *     description: Retrieve paginated list of sources
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [pdf, article, video, note, code, other]
 *       - in: query
 *         name: processed
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Sources retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     sources:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Source'
 *                     total:
 *                       type: number
 *                     page:
 *                       type: number
 *                     pages:
 *                       type: number
 */

/**
 * @swagger
 * /api/sources:
 *   post:
 *     tags: [Sources]
 *     summary: Create a new source
 *     description: Create a source (article URL or manual entry)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *                 example: JavaScript Closures
 *               type:
 *                 type: string
 *                 enum: [pdf, article, video, note, code, other]
 *                 example: article
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures
 *               content:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Source created successfully
 */

/**
 * @swagger
 * /api/sources/upload:
 *   post:
 *     tags: [Sources]
 *     summary: Upload a file source
 *     description: Upload PDF or other file as a source
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF, TXT, or other supported file (max 10MB)
 *               title:
 *                 type: string
 *                 description: Optional title (defaults to filename)
 *               type:
 *                 type: string
 *                 enum: [pdf, note, other]
 *                 default: other
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *       400:
 *         description: No file provided or invalid file type
 */

/**
 * @swagger
 * /api/sources/{id}:
 *   get:
 *     tags: [Sources]
 *     summary: Get source by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Source retrieved successfully
 *       404:
 *         description: Source not found
 */

/**
 * @swagger
 * /api/sources/{id}/extract:
 *   post:
 *     tags: [Extraction]
 *     summary: Extract concepts from source
 *     description: Use AI to extract learning concepts from PDF or article
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Source ID
 *     responses:
 *       200:
 *         description: Concepts extracted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     sourceId:
 *                       type: string
 *                     sourceTitle:
 *                       type: string
 *                     concepts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ExtractedConcept'
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         pageCount:
 *                           type: number
 *                         wordCount:
 *                           type: number
 *                         extractedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Source already processed or invalid source type
 *       404:
 *         description: Source not found
 */

/**
 * @swagger
 * /api/sources/{id}/save-concepts:
 *   post:
 *     tags: [Extraction]
 *     summary: Save extracted concepts
 *     description: Save selected concepts from extraction to knowledge base
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - concepts
 *             properties:
 *               concepts:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ExtractedConcept'
 *     responses:
 *       201:
 *         description: Concepts saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     source:
 *                       $ref: '#/components/schemas/Source'
 *                     concepts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Concept'
 *                     count:
 *                       type: number
 */

/**
 * @swagger
 * /api/challenges/generate:
 *   post:
 *     tags: [Challenges]
 *     summary: Generate AI challenges
 *     description: Generate multiple-choice challenges for a concept
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conceptId
 *             properties:
 *               conceptId:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *               count:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 default: 3
 *     responses:
 *       200:
 *         description: Challenges generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     challenges:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Challenge'
 *                     generated:
 *                       type: number
 *                     reused:
 *                       type: number
 */

/**
 * @swagger
 * /api/challenges/concept/{conceptId}:
 *   get:
 *     tags: [Challenges]
 *     summary: Get challenges for concept
 *     description: Retrieve existing challenges for a concept
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conceptId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Challenges retrieved successfully
 */

/**
 * @swagger
 * /api/challenges/{id}/attempt:
 *   post:
 *     tags: [Challenges]
 *     summary: Submit challenge answer
 *     description: Submit answer and receive feedback
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Challenge ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - selectedAnswer
 *             properties:
 *               selectedAnswer:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 3
 *                 example: 1
 *     responses:
 *       200:
 *         description: Answer submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     correct:
 *                       type: boolean
 *                     correctAnswer:
 *                       type: number
 *                     explanation:
 *                       type: string
 *                     pointsEarned:
 *                       type: number
 *                     newConfidence:
 *                       type: number
 *                     confidenceChange:
 *                       type: number
 *                     nextReview:
 *                       type: string
 *                       format: date-time
 */

/**
 * @swagger
 * /api/suggestions/daily:
 *   get:
 *     tags: [Study Plan]
 *     summary: Get daily study plan
 *     description: Retrieve personalized study suggestions for today
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Study plan retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date
 *                     totalEstimatedTime:
 *                       type: number
 *                       example: 45
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/StudySuggestion'
 */

/**
 * @swagger
 * /api/suggestions/daily/enhanced:
 *   get:
 *     tags: [Study Plan]
 *     summary: Get AI-enhanced study plan
 *     description: Get study plan with AI-generated motivational messages
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enhanced study plan retrieved
 */

/**
 * @swagger
 * /api/suggestions/focus-areas:
 *   get:
 *     tags: [Study Plan]
 *     summary: Get focus areas
 *     description: Retrieve grouped learning areas by category
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Focus areas retrieved successfully
 */

/**
 * @swagger
 * /api/decay/analysis:
 *   get:
 *     tags: [Decay Detection]
 *     summary: Get decay analysis
 *     description: Get comprehensive knowledge decay analysis
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analysis retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalConcepts:
 *                       type: number
 *                     conceptsAtRisk:
 *                       type: number
 *                     summary:
 *                       type: object
 *                       properties:
 *                         critical:
 *                           type: number
 *                         high:
 *                           type: number
 *                         medium:
 *                           type: number
 *                         low:
 *                           type: number
 *                     alerts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/DecayAlert'
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 */

/**
 * @swagger
 * /api/decay/urgent:
 *   get:
 *     tags: [Decay Detection]
 *     summary: Get urgent concepts
 *     description: Get concepts needing immediate attention
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Urgent concepts retrieved
 */

export {};