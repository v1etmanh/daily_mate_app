package com.app.service;

import com.app.model.DishRecommendationDto;
import com.app.model.TodoCreateRequest;
import com.app.model.TodoDto;
import com.app.model.TodoEvaluationResponse;
import com.app.model.UserProfile;
import com.app.model.UserProfileDto;
import com.app.model.WeatherConditionRequest;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class TodoOpenAiService {
     
    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
    private static final String apiKey = "";
    public TodoEvaluationResponse evaluateTodo(UserProfile user, TodoCreateRequest todo,WeatherConditionRequest w) {
        RestTemplate restTemplate = new RestTemplate();
        ObjectMapper mapper = new ObjectMapper();

        // 1. Tạo prompt
        String prompt = generatePrompt(user, todo,w);

        // 2. Body cho OpenAI API
        Map<String, Object> body = Map.of(
            "model", "gpt-4o",
            "messages", List.of(
                Map.of("role", "user", "content", prompt)
            ),
            "temperature", 0.7
        );

        // 3. Headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        // 4. Gửi yêu cầu tới GPT
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(OPENAI_API_URL, entity, Map.class);

        // 5. Lấy content từ phản hồi
        Map<String, Object> message = (Map<String, Object>) ((Map)((List<?>) response.getBody().get("choices")).get(0)).get("message");
        String content = (String) message.get("content");

        try {
            // 🧹 6. Xử lý sạch đoạn content trước khi parse
            String cleanJson = content
                .replaceAll("(?s)^```json\\s*", "")  // Xoá ```json ở đầu
                .replaceAll("(?s)```\\s*$", "");     // Xoá ``` ở cuối (nếu có)

            // ✅ Parse JSON sau khi đã làm sạch
            return mapper.readValue(cleanJson, TodoEvaluationResponse.class);
        } catch (Exception e) {
            System.out.println("❌ Không thể parse JSON từ GPT:\n" + content);
            throw new RuntimeException("Lỗi khi parse JSON từ GPT", e);
        }
    }

   
    private String generatePrompt(UserProfile user, TodoCreateRequest todo, WeatherConditionRequest w) {
        return String.format("""
            🏥 THÔNG TIN NGƯỜI DÙNG:
            - Giới tính: %s
            - Tuổi: %d tuổi
            - Chiều cao: %.1f cm
            - Cân nặng: %.1f kg
            - BMI: %.1f (%s)
            - Tình trạng sức khỏe: %s
            - Mục tiêu ăn uống: %s

            📝 HOẠT ĐỘNG ĐƯỢC LÊN KẾ HOẠCH:
            - Mô tả: "%s"
            - Thời gian bắt đầu: %s
            - Thời gian dự kiến: %.1f giờ
            - Địa điểm: %s

            🌦️ ĐIỀU KIỆN THỜI TIẾT TẠI ĐỊA ĐIỂM:
            - Tình trạng: %s
            - Nhiệt độ: %.1f°C
            - Cảm giác thực tế: %.1f°C
            - Độ ẩm: %d%%
            - Áp suất: %d hPa

            🎯 YÊU CẦU ĐÁNH GIÁ:
            Dựa trên thông tin sức khỏe, độ tuổi, BMI và tình trạng thể chất của người dùng, 
            hãy đánh giá hoạt động này có phù hợp không?

            Cần xem xét:
            - Cường độ hoạt động có phù hợp với thể trạng không?
            - Thời gian thực hiện có hợp lý không?
            - Có cần chuẩn bị gì đặc biệt không?
            - Có rủi ro sức khỏe nào cần lưu ý không?
            - Thời tiết tại địa điểm thực hiện có gì đáng quan ngại không?

            ⚠️ QUAN TRỌNG: Chỉ trả về JSON thuần túy, KHÔNG có markdown. Giới hạn độ dài như sau:

            {
               "evaluation": "Đánh giá mức độ phù hợp tổng thể (TỐI ĐA 75 từ)",
               "warning": "Cảnh báo về sức khỏe/thời gian nếu có (TỐI ĐA 50 từ, hoặc để trống)",
               "priority": "HIGH | MEDIUM | LOW",
               "healthImpact": "Lợi ích sức khỏe chính (TỐI ĐA 20 từ)",
               "weatherSuitability": "Phù hợp | Không phù hợp",
               "preparationNeeded": "Những thứ nên mang theo (TỐI ĐA 20 từ)",
               "alternativeActivity": "Gợi ý hoạt động thay thế nếu không phù hợp (TỐI ĐA 40 từ)"
            }

            🔥 LƯU Ý: Hãy viết ngắn gọn, súc tích, đi thẳng vào vấn đề. Không dài dòng!
            """,
            user.getGender(),
            user.getAge(),
            user.getHeightCm(),
            user.getWeightKg(),
            user.getBmi(),
            user.getBmiCategory(),
            user.getHealthCondition(),
            user.getDietaryGoal(),
            todo.getDescription(),
            todo.getTimeStart(),
            todo.getEstimateTime(),
            todo.getLocation(),
            w.getMain(),
            w.getTemperature(),
            w.getFellingTemp(),
            w.getHumidity(),
            w.getPressure()
        );
    }

   
    public TodoEvaluationResponse evaluateFamilyTodo(TodoCreateRequest todo,WeatherConditionRequest w) {
        RestTemplate restTemplate = new RestTemplate();
        ObjectMapper mapper = new ObjectMapper();

        String prompt = generateFamilyPrompt(todo,w);

        Map<String, Object> body = Map.of(
            "model", "gpt-4o",
            "messages", List.of(
                Map.of("role", "user", "content", prompt)
            ),
            "temperature", 0.7
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(OPENAI_API_URL, entity, Map.class);

        Map<String, Object> message = (Map<String, Object>) ((Map)((List<?>) response.getBody().get("choices")).get(0)).get("message");
        String content = (String) message.get("content");

        try {
            // 🧹 Thêm JSON cleaning như method kia
            String cleanJson = content
                .replaceAll("(?s)^```json\\s*", "")
                .replaceAll("(?s)```\\s*$", "")
                .trim();
                
            return mapper.readValue(cleanJson, TodoEvaluationResponse.class);
        } catch (Exception e) {
            System.out.println("❌ Không thể parse JSON từ GPT:\n" + content);
            throw new RuntimeException("Lỗi khi parse JSON từ GPT", e);
        }
    }
    
    private String generateFamilyPrompt(TodoCreateRequest todo, WeatherConditionRequest w) {
        return String.format("""
            🏠 HOẠT ĐỘNG GIA ĐÌNH:
            - Mô tả: "%s"
            - Thời gian bắt đầu: %s
            - Thời gian dự kiến: %.1f giờ
            - Địa điểm: %s

            🌦️ THỜI TIẾT TẠI ĐỊA ĐIỂM:
            - Tình trạng: %s
            - Nhiệt độ: %.1f°C
            - Cảm giác thực tế: %.1f°C
            - Độ ẩm: %d%%
            - Áp suất: %d hPa

            🎯 YÊU CẦU ĐÁNH GIÁ:
            Hãy đánh giá hoạt động này có phù hợp cho các thành viên gia đình không?

            Xem xét các yếu tố:
            - Thời gian có hợp lý cho cả gia đình không?
            - Hoạt động có phù hợp với nhiều độ tuổi không?
            - Có cần chuẩn bị gì đặc biệt không?
            - Có rủi ro an toàn nào cần lưu ý không?
            - Khoảng cách di chuyển có phù hợp không?
            - Thời tiết tại địa điểm đó có cần chú ý gì không?

            ⚠️ QUAN TRỌNG: Chỉ trả về JSON thuần túy, KHÔNG có markdown. Giới hạn độ dài như sau:

            {
               "evaluation": "Đánh giá mức độ phù hợp tổng thể (TỐI ĐA 75 từ)",
               "warning": "Cảnh báo về sức khỏe/thời gian nếu có (TỐI ĐA 50 từ, hoặc để trống)",
               "priority": "HIGH | MEDIUM | LOW",
               "healthImpact": "Lợi ích sức khỏe chính (TỐI ĐA 25 từ)",
               "weatherSuitability": "Phù hợp | Không phù hợp",
               "preparationNeeded": "Những thứ nên mang theo (TỐI ĐA 30 từ)",
               "alternativeActivity": "Gợi ý hoạt động thay thế nếu không phù hợp (TỐI ĐA 40 từ)"
            }

            🔥 LƯU Ý: Hãy viết ngắn gọn, súc tích, đi thẳng vào vấn đề. Không dài dòng!
            """,
            todo.getDescription(),
            todo.getTimeStart(),
            todo.getEstimateTime(),
            todo.getLocation(),
            w.getMain(),
            w.getTemperature(),
            w.getFellingTemp(),
            w.getHumidity(),
            w.getPressure()
        );
    }
    private String generateActivityPrompt(UserProfile user, WeatherConditionRequest w) {
        return String.format("""
            🧑‍⚕️ THÔNG TIN NGƯỜI DÙNG:
            - Giới tính: %s
            - Tuổi: %d tuổi
            - Chiều cao: %.1f cm
            - Cân nặng: %.1f kg
            - BMI: %.1f (%s)
            - Tình trạng sức khỏe: %s
            - Mục tiêu ăn uống: %s

            🌦️ THỜI TIẾT HIỆN TẠI:
            - Tình trạng: %s
            - Nhiệt độ: %.1f°C
            - Cảm giác thực tế: %.1f°C
            - Độ ẩm: %d%%
            - Áp suất: %d hPa

            🎯 YÊU CẦU:
            Hãy gợi ý một hoạt động phù hợp nhất hôm nay cho người này, đồng thời trả về đúng JSON sau:

            {
               "description": "Tên hoạt động ngắn gọn",
               "timeStart":   "YYYY-MM-DDTHH:MM:SS",
               "estimateTime": số giờ ước tính (ví dụ: 1.0),
               "evaluation": "Đánh giá mức độ phù hợp tổng thể (tối đa 75 từ)",
               "warning": "Cảnh báo về sức khỏe/thời tiết nếu có (tối đa 50 từ hoặc để trống)",
               "priority": "HIGH | MEDIUM | LOW",
               "healthImpact": "Lợi ích sức khỏe chính (tối đa 20 từ)",
               "weatherSuitability": "Phù hợp | Không phù hợp",
               "preparationNeeded": "Những thứ cần mang theo (tối đa 20 từ)",
               "alternativeActivity": "Hoạt động thay thế nếu không phù hợp (tối đa 40 từ)"
            }

            ⚠️ KHÔNG markdown, KHÔNG bình luận thêm. Trả JSON duy nhất.
            """,
            user.getGender(),
            user.getAge(),
            user.getHeightCm(),
            user.getWeightKg(),
            user.getBmi(),
            user.getBmiCategory(),
            user.getHealthCondition(),
            user.getDietaryGoal(),
            w.getMain(),
            w.getTemperature(),
            w.getFellingTemp(),
            w.getHumidity(),
            w.getPressure()
        );
    }
    public TodoDto suggestPersonalActivity(UserProfile user, WeatherConditionRequest w) throws IOException, InterruptedException {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        String prompt = generateActivityPrompt(user, w);

        String payload = """
            {
                "model": "gpt-4o",
                "messages": [
                    {
                        "role": "system",
                        "content": "Bạn là chuyên gia thể dục và sức khỏe..."
                    },
                    {
                        "role": "user",
                        "content": %s
                    }
                ],
                "temperature": 0.3,
                "max_tokens": 4000
            }
            """.formatted(mapper.writeValueAsString(prompt));

        HttpRequest httpRequest = HttpRequest.newBuilder()
            .uri(URI.create(OPENAI_API_URL))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + apiKey)
            .POST(HttpRequest.BodyPublishers.ofString(payload))
            .build();

        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("API call failed with status: " + response.statusCode());
        }

        JsonNode root = mapper.readTree(response.body());
        String replyContent = root.get("choices").get(0).get("message").get("content").asText();

        try {
            String cleanJson = replyContent
                .replaceAll("(?s)^```json\\s*", "")
                .replaceAll("(?s)```\\s*$", "")
                .trim();

            TodoDto todo = mapper.readValue(cleanJson, TodoDto.class);
            return todo;
        } catch (Exception e) {
            System.err.println("❌ Failed to parse response: " + replyContent);
            throw new RuntimeException("Failed to parse AI response", e);
        }
    }
    private String generateFamilyActivityPrompt(WeatherConditionRequest w, String location) {
        return String.format("""
            📍 VỊ TRÍ:
            - Khu vực: %s

            🌦️ THỜI TIẾT HIỆN TẠI:
            - Tình trạng: %s
            - Nhiệt độ: %.1f°C
            - Cảm giác thực tế: %.1f°C
            - Độ ẩm: %d%%
            - Áp suất: %d hPa

            👨‍👩‍👧‍👦 YÊU CẦU:
            Hãy gợi ý một hoạt động ngoài trời hoặc trong nhà phù hợp cho **cả gia đình cùng tham gia** vào hôm nay. Dựa trên điều kiện thời tiết và vị trí hiện tại. Trả về đúng JSON sau:

            {
               "description": "Tên hoạt động ngắn gọn",
               "timeStart":   "YYYY-MM-DDTHH:MM:SS"
               "estimateTime": số giờ ước tính (ví dụ: 1.5), 
               "evaluation": "Đánh giá mức độ phù hợp tổng thể (tối đa 75 từ)",
               "warning": "Cảnh báo về sức khỏe/thời tiết nếu có (tối đa 50 từ hoặc để trống)",
               "priority": "HIGH | MEDIUM | LOW",
               "healthImpact": "Lợi ích sức khỏe chính (tối đa 20 từ)",
               "weatherSuitability": "Phù hợp | Không phù hợp",
               "preparationNeeded": "Những thứ cần mang theo (tối đa 20 từ)",
               "alternativeActivity": "Hoạt động thay thế nếu không phù hợp (tối đa 40 từ)"
            }

            ⚠️ KHÔNG markdown, KHÔNG bình luận thêm. Trả JSON duy nhất.
            """,
            location,
            w.getMain(),
            w.getTemperature(),
            w.getFellingTemp(),
            w.getHumidity(),
            w.getPressure()
        );
    }
    public TodoDto suggestFamilyActivity(String location, WeatherConditionRequest w) throws IOException, InterruptedException {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        String prompt = generateFamilyActivityPrompt(w, location);

        String payload = """
            {
                "model": "gpt-4o",
                "messages": [
                    {
                        "role": "system",
                        "content": "Bạn là chuyên gia thể dục, sức khỏe và tổ chức hoạt động cho gia đình."
                    },
                    {
                        "role": "user",
                        "content": %s
                    }
                ],
                "temperature": 0.3,
                "max_tokens": 4000
            }
            """.formatted(mapper.writeValueAsString(prompt));

        HttpRequest httpRequest = HttpRequest.newBuilder()
            .uri(URI.create(OPENAI_API_URL))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + apiKey)
            .POST(HttpRequest.BodyPublishers.ofString(payload))
            .build();

        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("API call failed with status: " + response.statusCode());
        }

        JsonNode root = mapper.readTree(response.body());
        String replyContent = root.get("choices").get(0).get("message").get("content").asText();

        try {
            String cleanJson = replyContent
                .replaceAll("(?s)^```json\\s*", "")
                .replaceAll("(?s)```\\s*$", "")
                .trim();

            return mapper.readValue(cleanJson, TodoDto.class);
        } catch (Exception e) {
            System.err.println("❌ Failed to parse response: " + replyContent);
            throw new RuntimeException("Failed to parse AI response", e);
        }
    }


}