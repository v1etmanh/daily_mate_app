package com.app.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.app.model.HealthAssessmentResponse;
import com.app.model.UserProfile;
import com.app.model.PossibleCondition;
import com.app.repository.HealthAssessmentRepository;
import com.app.repository.UserProfileRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class HealthAssessmentService {
    
    private static final Logger logger = LoggerFactory.getLogger(HealthAssessmentService.class);
    
    @Value("${openai.api.key}")
    private String apiKey;
    
    @Value("${openai.api.url}")
    private String apiUrl;
    
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final UserProfileRepository userProfileRepository;
    private final HealthAssessmentRepository healthAssessmentRepository;
    
    public HealthAssessmentService(
            UserProfileRepository userProfileRepository,
            HealthAssessmentRepository healthAssessmentRepository) {
        this.userProfileRepository = userProfileRepository;
        this.healthAssessmentRepository = healthAssessmentRepository;
        this.objectMapper = new ObjectMapper();
        this.restTemplate = new RestTemplate();
    }
    
    /**
     * Tạo đánh giá sức khỏe dựa trên triệu chứng
     */
    public HealthAssessmentResponse createHealthAssessment(Long userId, String bodyPart, String symptom) {
        try {
            logger.info("Creating health assessment for user: {}, bodyPart: {}, symptom: {}", 
                       userId, bodyPart, symptom);
            
            // 1. Validate input
            validateInput(userId, bodyPart, symptom);
            
            // 2. Get user profile
            UserProfile user = getUserProfile(userId);
            
            // 3. Build prompt với thông tin user và call OpenAI API
            String aiResponse = callOpenAiApi(user, bodyPart, symptom);
            
            // 4. Parse AI response
            HealthAssessmentResponse assessment = parseAiResponse(aiResponse);
            
            // 5. Set user và save
            assessment.setUser(user);
            HealthAssessmentResponse savedAssessment = healthAssessmentRepository.save(assessment);
            
            logger.info("Health assessment created successfully with ID: {}", savedAssessment.getHealthId());
            return savedAssessment;
            
        } catch (Exception e) {
            logger.error("Error creating health assessment for user: {}", userId, e);
            throw new RuntimeException("Không thể tạo đánh giá sức khỏe: " + e.getMessage(), e);
        }
    }
    
    /**
     * Validate đầu vào
     */
    private void validateInput(Long userId, String bodyPart, String symptom) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID không được null");
        }
        
        if (!StringUtils.hasText(bodyPart)) {
            throw new IllegalArgumentException("Vùng cơ thể không được trống");
        }
        
        if (!StringUtils.hasText(symptom)) {
            throw new IllegalArgumentException("Mô tả triệu chứng không được trống");
        }
        
        if (bodyPart.length() > 100) {
            throw new IllegalArgumentException("Vùng cơ thể quá dài (tối đa 100 ký tự)");
        }
        
        if (symptom.length() > 1000) {
            throw new IllegalArgumentException("Mô tả triệu chứng quá dài (tối đa 1000 ký tự)");
        }
    }
    
    /**
     * Lấy thông tin user
     */
    private UserProfile getUserProfile(Long userId) {
        Optional<UserProfile> userOptional = userProfileRepository.findById(userId);
        if (userOptional.isEmpty()) {
            throw new RuntimeException("Không tìm thấy user với ID: " + userId);
        }
        return userOptional.get();
    }
    
    /**
     * Gọi OpenAI API
     */
    private String callOpenAiApi(UserProfile user, String bodyPart, String symptom) {
        try {
            // Build prompt với thông tin user
            String prompt = buildHealthPrompt(user, bodyPart, symptom);
            
            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            
            // Build request body
            Map<String, Object> requestBody = buildRequestBody(prompt);
            
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
            
            // Call API
            logger.debug("Calling OpenAI API with prompt: {}", prompt);
            ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, requestEntity, String.class);
            
            // Validate response
            if (!response.getStatusCode().equals(HttpStatus.OK)) {
                throw new RuntimeException("OpenAI API trả về lỗi: " + response.getStatusCode());
            }
            
            if (!StringUtils.hasText(response.getBody())) {
                throw new RuntimeException("OpenAI API trả về response rỗng");
            }
            
            // Extract content from response
            String content = extractContentFromResponse(response.getBody());
            logger.debug("OpenAI response: {}", content);
            
            return content;
            
        } catch (RestClientException e) {
            logger.error("Error calling OpenAI API", e);
            throw new RuntimeException("Lỗi khi gọi OpenAI API: " + e.getMessage(), e);
        }
    }
    
    /**
     * Build request body cho OpenAI API
     */
    private Map<String, Object> buildRequestBody(String prompt) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "gpt-4");
        requestBody.put("messages", List.of(
            Map.of("role", "system", "content", "You are a professional medical AI assistant. Always respond with valid JSON format."),
            Map.of("role", "user", "content", prompt)
        ));
        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", 1000);
        
        return requestBody;
    }
    
    /**
     * Trích xuất content từ OpenAI response
     */
    private String extractContentFromResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            
            // Check for errors
            if (root.has("error")) {
                throw new RuntimeException("OpenAI API error: " + root.get("error").get("message").asText());
            }
            
            // Extract content
            JsonNode choices = root.get("choices");
            if (choices == null || choices.isEmpty()) {
                throw new RuntimeException("OpenAI response không có choices");
            }
            
            JsonNode message = choices.get(0).get("message");
            if (message == null) {
                throw new RuntimeException("OpenAI response không có message");
            }
            
            JsonNode content = message.get("content");
            if (content == null) {
                throw new RuntimeException("OpenAI response không có content");
            }
            
            return content.asText();
            
        } catch (JsonProcessingException e) {
            logger.error("Error parsing OpenAI response", e);
            throw new RuntimeException("Lỗi parse OpenAI response: " + e.getMessage(), e);
        }
    }
    
    /**
     * Parse AI response thành HealthAssessmentResponse
     */
    private HealthAssessmentResponse parseAiResponse(String aiResponse) {
        try {
            // Clean content (remove markdown if present)
            String cleanContent = cleanJsonContent(aiResponse);
            
            // Parse JSON
            JsonNode root = objectMapper.readTree(cleanContent);
            
            // Create health assessment object
            HealthAssessmentResponse assessment = new HealthAssessmentResponse();
            
            // Set basic fields với null check
            assessment.setBodyPart(getTextValue(root, "bodyPart", ""));
            assessment.setSymptomDescription(getTextValue(root, "symptomDescription", ""));
            assessment.setEmergencyLevel(getTextValue(root, "emergencyLevel", "Thấp"));
            assessment.setRecommendSeeDoctor(getBooleanValue(root, "recommendSeeDoctor", false));
            
            // Set special considerations nếu có
            String specialConsiderations = getTextValue(root, "specialConsiderations", "");
            if (!specialConsiderations.isEmpty()) {
                // Có thể thêm field này vào model hoặc append vào symptomDescription
                assessment.setSymptomDescription(assessment.getSymptomDescription() + "\n\nLưu ý đặc biệt: " + specialConsiderations);
            }
            
            // Parse suggested actions
            List<String> actions = parseStringArray(root, "suggestedActions");
            assessment.setSuggestedActions(actions);
            
            // Parse possible conditions
            List<PossibleCondition> conditions = parsePossibleConditions(root, assessment);
            assessment.setPossibleConditions(conditions);
            
            return assessment;
            
        } catch (Exception e) {
            logger.error("Error parsing AI response: {}", aiResponse, e);
            throw new RuntimeException("Lỗi parse phản hồi AI: " + e.getMessage(), e);
        }
    }
    
    /**
     * Clean JSON content (remove markdown nếu có)
     */
    private String cleanJsonContent(String content) {
        String cleaned = content.trim();
        
        // Remove markdown code blocks
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        
        return cleaned.trim();
    }
    
    /**
     * Get text value từ JsonNode với default
     */
    private String getTextValue(JsonNode node, String fieldName, String defaultValue) {
        JsonNode field = node.get(fieldName);
        return (field != null && !field.isNull()) ? field.asText() : defaultValue;
    }
    
    /**
     * Get boolean value từ JsonNode với default
     */
    private boolean getBooleanValue(JsonNode node, String fieldName, boolean defaultValue) {
        JsonNode field = node.get(fieldName);
        return (field != null && !field.isNull()) ? field.asBoolean() : defaultValue;
    }
    
    /**
     * Parse string array từ JsonNode
     */
    private List<String> parseStringArray(JsonNode root, String fieldName) {
        List<String> result = new ArrayList<>();
        JsonNode arrayNode = root.get(fieldName);
        
        if (arrayNode != null && arrayNode.isArray()) {
            for (JsonNode item : arrayNode) {
                if (!item.isNull()) {
                    result.add(item.asText());
                }
            }
        }
        
        return result;
    }
    
    /**
     * Parse possible conditions từ JsonNode
     */
    private List<PossibleCondition> parsePossibleConditions(JsonNode root, HealthAssessmentResponse assessment) {
        List<PossibleCondition> conditions = new ArrayList<>();
        JsonNode conditionsNode = root.get("possibleConditions");
        
        if (conditionsNode != null && conditionsNode.isArray()) {
            for (JsonNode condNode : conditionsNode) {
                PossibleCondition condition = new PossibleCondition();
                
                condition.setName(getTextValue(condNode, "name", ""));
                condition.setLikelihood(getTextValue(condNode, "likelihood", "Thấp"));
                condition.setDescription(getTextValue(condNode, "description", ""));
                condition.setHealths(assessment); // Set back reference
                
                conditions.add(condition);
            }
        }
        
        return conditions;
    }
    
    /**
     * Build health prompt với thông tin chi tiết từ UserProfile
     */
    private String buildHealthPrompt(UserProfile user, String bodyPart, String symptom) {
        StringBuilder userInfo = new StringBuilder();
        
        // Basic demographics
        if (user.getName() != null) {
            userInfo.append("- Name: ").append(user.getName()).append("\n");
        }
        if (user.getAge() != null) {
            userInfo.append("- Age: ").append(user.getAge()).append(" years old\n");
        }
        if (user.getGender() != null) {
            userInfo.append("- Gender: ").append(user.getGender()).append("\n");
        }
        
        // Physical stats
        if (user.getHeightCm() != null && user.getWeightKg() != null) {
            userInfo.append("- Height: ").append(user.getHeightCm()).append(" cm\n");
            userInfo.append("- Weight: ").append(user.getWeightKg()).append(" kg\n");
        }
        if (user.getBmi() != null) {
            userInfo.append("- BMI: ").append(String.format("%.1f", user.getBmi()));
            if (user.getBmiCategory() != null) {
                userInfo.append(" (").append(user.getBmiCategory()).append(")");
            }
            userInfo.append("\n");
        }
        
        // Health conditions
        if (user.getHealthCondition() != null && !user.getHealthCondition().trim().isEmpty()) {
            userInfo.append("- Current Health Conditions: ").append(user.getHealthCondition()).append("\n");
        }
        if (user.getAllergies() != null && !user.getAllergies().trim().isEmpty()) {
            userInfo.append("- Known Allergies: ").append(user.getAllergies()).append("\n");
        }
        
        // Lifestyle factors
        if (user.getDietaryGoal() != null && !user.getDietaryGoal().trim().isEmpty()) {
            userInfo.append("- Dietary Goal: ").append(user.getDietaryGoal()).append("\n");
        }
        if (user.getTastePreference() != null && !user.getTastePreference().trim().isEmpty()) {
            userInfo.append("- Food Preferences: ").append(user.getTastePreference()).append("\n");
        }
        if (user.getDislikedIngredients() != null && !user.getDislikedIngredients().trim().isEmpty()) {
            userInfo.append("- Food Dislikes/Restrictions: ").append(user.getDislikedIngredients()).append("\n");
        }
        
        // Previous AI analysis
        if (user.getHealthDescription() != null && !user.getHealthDescription().trim().isEmpty()) {
            userInfo.append("- Previous Health Assessment: ").append(user.getHealthDescription()).append("\n");
        }
        if (user.getWarnings() != null && !user.getWarnings().trim().isEmpty()) {
            userInfo.append("- Previous Health Warnings: ").append(user.getWarnings()).append("\n");
        }
        
        return String.format("""
            You are a professional medical AI assistant. Please analyze the following case:
            
            **PATIENT INFORMATION:**
            %s
            
            **CURRENT SYMPTOMS:**
            - Affected body part: "%s"
            - Symptom description: "%s"
            
            Based on this comprehensive information, please provide a detailed health assessment in JSON format:
            
            {
              "bodyPart": "string",
              "symptomDescription": "string (refined/expanded based on patient context)",
              "possibleConditions": [
                {
                  "name": "condition name",
                  "likelihood": "High|Medium|Low",
                  "description": "detailed explanation considering patient's age, gender, BMI, existing conditions"
                }
              ],
              "suggestedActions": [
                "action 1 (personalized for this patient)",
                "action 2 (considering allergies/restrictions)",
                "action 3 (age/gender appropriate)",
                "action 4 (considering existing health conditions)",
                "action 5 (lifestyle modifications if relevant)"
              ],
              "emergencyLevel": "High|Medium|Low",
              "recommendSeeDoctor": boolean,
              "specialConsiderations": "any special notes based on patient profile"
            }
            
            **IMPORTANT GUIDELINES:**
            - Consider the patient's age and gender for condition likelihood
            - Factor in BMI and physical stats for relevant conditions
            - Account for existing health conditions and their interactions
            - Be extra cautious with elderly patients, pregnant women, or those with chronic conditions
            - Consider allergies when suggesting treatments
            - Provide 2-4 most likely conditions based on the complete profile
            - Use Vietnamese language for all descriptions and suggestions
            - Be conservative - when in doubt, recommend seeing a doctor
            - Return only valid JSON, no additional text
            """, 
            userInfo.toString().trim().isEmpty() ? "No detailed profile available" : userInfo.toString().trim(),
            bodyPart, 
            symptom
        );
    }
}