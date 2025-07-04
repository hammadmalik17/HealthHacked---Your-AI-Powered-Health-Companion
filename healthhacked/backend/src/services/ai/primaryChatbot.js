
const geminiService = require('./geminiService');
const HealthContext = require('../../models/HealthContext');
const CarePlan = require('../../models/CarePlan');
const { extractSymptoms, mapSeverity, generateSessionId } = require('../../utils/helpers');
const logger = require('../../utils/logger');

class PrimaryChatbot {
  static async handleMedicalQuery(userInput, userContext) {
    try {
      const medicalPrompt = this.buildMedicalQueryPrompt(userInput, userContext);
      
      // Use generateStructuredResponse instead of generateWithSafety
      const result = await geminiService.generateStructuredResponse(medicalPrompt);
      
      const response = result.content; // This is already parsed JSON
      
      // Store health context
      const healthContext = await this.createHealthContext(userContext.userId, userInput, response);
      
      // Create initial care plan
      await this.createInitialCarePlan(userContext.userId, healthContext._id, response);
      
      return {
        response: response.response,
        potentialCauses: response.potentialCauses,
        immediateSteps: response.immediateSteps,
        seekHelpIf: response.seekHelpIf,
        followUpQuestion: response.followUpQuestion,
        severity: response.severity,
        contextId: healthContext._id,
        sessionId: healthContext.sessionId,
        processingTime: result.processingTime
      };

    } catch (error) {
      logger.error('Primary chatbot medical query error:', error);
      return this.getFallbackMedicalResponse(userInput);
    }
  }

  static buildMedicalQueryPrompt(userInput, userContext) {
    return `
You are a compassionate medical information assistant. A user describes: "${userInput}"

USER PROFILE:
- Name: ${userContext.profile?.name || 'User'}
- Age: ${userContext.profile?.age || 'Not specified'}
- Gender: ${userContext.profile?.gender || 'Not specified'}
- Has active health concerns: ${userContext.hasActiveHealthConcern}

INSTRUCTIONS:
Provide a helpful response that:
1. Acknowledges their concern empathetically
2. Lists 3-5 potential causes (both lifestyle and medical factors)
3. Provides 3-5 practical immediate steps they can take
4. Clearly advises when to seek professional medical help
5. Asks a relevant follow-up question to gather more context
6. Assesses severity level

IMPORTANT:
- Be informative but NOT diagnostic
- Always emphasize professional consultation for serious concerns
- Use supportive, caring language
- Focus on immediate self-care when appropriate
    `;
  }

  static async createHealthContext(userId, userInput, aiResponse) {
    const sessionId = generateSessionId();
    
    const healthContext = new HealthContext({
      userId,
      sessionId,
      primaryConcern: userInput,
      symptoms: extractSymptoms(userInput),
      severity: mapSeverity(aiResponse.severity),
      aiAssessment: {
        potentialCauses: aiResponse.potentialCauses,
        immediateSteps: aiResponse.immediateSteps,
        seekHelpIf: aiResponse.seekHelpIf,
        riskLevel: aiResponse.severity
      }
    });

    await healthContext.save();
    logger.info('Health context created', { 
      userId, 
      contextId: healthContext._id,
      severity: aiResponse.severity 
    });
    
    return healthContext;
  }

  static async createInitialCarePlan(userId, contextId, aiResponse) {
    // Create structured recommendations from AI response
    const recommendations = aiResponse.immediateSteps.map((step, index) => ({
      title: `Recommendation ${index + 1}`,
      description: step,
      type: 'immediate',
      priority: index + 1,
      dueDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000) // Due dates 1, 2, 3 days from now
    }));

    const carePlan = new CarePlan({
      userId,
      contextId,
      title: 'Initial Care Plan',
      description: 'Immediate steps to address your health concern',
      recommendations,
      status: 'active'
    });

    await carePlan.save();
    logger.info('Initial care plan created', { userId, contextId, carePlanId: carePlan._id });
    
    return carePlan;
  }

  static async handleGeneralWellness(userInput, userContext) {
    try {
      const wellnessPrompt = `
You are a helpful wellness assistant providing general health information.

User asks: "${userInput}"

Provide helpful wellness information that:
1. Answers their question clearly
2. Gives practical, actionable advice
3. Promotes healthy lifestyle choices
4. Is encouraging and supportive

Keep your response conversational and under 200 words.
      `;

      // For wellness queries, we can use regular generateContent
      const result = await geminiService.generateContent(wellnessPrompt);
      
      return {
        response: result.content,
        tips: [
          "Stay hydrated throughout the day",
          "Aim for 7-9 hours of quality sleep",
          "Include physical activity in your daily routine"
        ],
        category: "general",
        processingTime: result.processingTime
      };

    } catch (error) {
      logger.error('Primary chatbot wellness query error:', error);
      return this.getFallbackWellnessResponse();
    }
  }

  static getFallbackMedicalResponse(userInput) {
    return {
      response: "I understand you're experiencing some health concerns. While I'd like to help, I'm having some technical difficulties. Please try again or consult with a healthcare professional for immediate assistance.",
      potentialCauses: [
        "Various factors could be contributing to your symptoms",
        "Lifestyle factors like stress, sleep, or diet",
        "Underlying medical conditions that need professional evaluation"
      ],
      immediateSteps: [
        "Monitor your symptoms and note any changes",
        "Ensure you're getting adequate rest and hydration",
        "Consider contacting a healthcare provider"
      ],
      seekHelpIf: [
        "Symptoms worsen or persist",
        "You develop new concerning symptoms",
        "You feel the situation is urgent"
      ],
      followUpQuestion: "How long have you been experiencing these symptoms?",
      severity: "medium"
    };
  }

  static getFallbackWellnessResponse() {
    return {
      response: "That's a great wellness question! Maintaining good health involves many factors including proper nutrition, regular exercise, adequate sleep, and stress management.",
      tips: [
        "Stay hydrated throughout the day",
        "Aim for 7-9 hours of quality sleep",
        "Include physical activity in your daily routine"
      ],
      category: "general"
    };
  }
}

module.exports = PrimaryChatbot;