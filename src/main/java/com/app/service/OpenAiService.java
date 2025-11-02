package com.app.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.app.model.HealthAdviceResponse;
import com.app.model.UserProfileCreateRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;



@Service
public class OpenAiService {

	  @Value("${openai.api.key}")
	    private String API_KEY;
	    
	    @Value("${openai.api.url}")
	    private String API_URL; 
     public HealthAdviceResponse getHealthAdvice(UserProfileCreateRequest request) throws JsonProcessingException {
        RestTemplate restTemplate = new RestTemplate();
        String prompt = generatePrompt(request);
        
        Map<String, Object> body = new HashMap<>();
        body.put("model", "gpt-4o");
        body.put("messages", List.of(
            Map.of("role", "user", "content", prompt)
        ));
        body.put("temperature", 0.7);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(API_KEY);
        
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(API_URL, entity, Map.class);
        
        Map<String, Object> messageMap = (Map<String, Object>) ((Map)((List)response.getBody().get("choices")).get(0)).get("message");
        String content = (String) messageMap.get("content");
        
//        System.out.println("Response từ GPT:\n" + content);
        
        // Làm sạch content - loại bỏ markdown formatting
        String cleanedContent = cleanJsonResponse(content);
        System.out.println("Cleaned content:\n" + cleanedContent);
        
        ObjectMapper mapper = new ObjectMapper();
        return mapper.readValue(cleanedContent, HealthAdviceResponse.class);
    }

    private String cleanJsonResponse(String content) {
        // Loại bỏ markdown code blocks
        content = content.replaceAll("```json", "");
        content = content.replaceAll("```", "");
        
        // Loại bỏ whitespace thừa ở đầu và cuối
        content = content.trim();
        
        // Tìm và extract JSON object
        int start = content.indexOf("{");
        int end = content.lastIndexOf("}") + 1;
        
        if (start >= 0 && end > start) {
            content = content.substring(start, end);
        }
        
        return content;
    }

    private String generatePrompt(UserProfileCreateRequest req) {
        return String.format("""
            Dựa trên các thông tin sau:
            - Tên: %s
            - Tuổi: %d
            - Giới tính: %s
            - Chiều cao: %.1f cm
            - Cân nặng: %.1f kg
            - Mục tiêu ăn kiêng: %s
            - Tình trạng sức khỏe: %s
            - Khẩu vị: %s
            
            Hãy phân tích và trả về CHÍNH XÁC JSON theo format sau:
            
            {
              "healthDescription": "Mô tả tình trạng sức khỏe hiện tại dựa trên BMI và thông tin cá nhân (tối đa 200 từ)",
              "recommendedActivities": "Danh sách các hoạt động thể chất phù hợp (tối đa 150 từ)",
              "warnings": "Các cảnh báo sức khỏe cần lưu ý (tối đa 100 từ)",
              "dietAdvice": "Lời khuyên dinh dưỡng cụ thể (tối đa 200 từ)",
              "targetWeight": "Cân nặng mục tiêu (số thập phân, đơn vị kg)"
            }
            
            YÊU CẦU NGHIÊM NGẶT:
            - CHỈ trả về JSON thuần túy
            - KHÔNG có ```json hoặc markdown
            - KHÔNG có văn bản giải thích
            - Tất cả giá trị string phải trong dấu ngoặc kép
            - targetWeight phải là số, không có dấu ngoặc kép
            - Nội dung tiếng Việt, chuyên nghiệp
            """, 
            req.getName(), req.getAge(), req.getGender().toString(), 
            req.getHeightCm(), req.getWeightKg(), req.getDietaryGoal(), 
            req.getHealthCondition(), req.getTastePreference()
        );
    }
}