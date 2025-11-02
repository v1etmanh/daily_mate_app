package com.app.service;

import com.app.model.DishAdviceResponse;
import com.app.model.DishFormRequest;
import com.app.model.DishRecommendation;
import com.app.model.DishRecommendationDto;
import com.app.model.DishUserRequest;
import com.app.model.EvaluateResult;
import com.app.model.IngredientResponse;
import com.app.model.Location;
import com.app.model.RequestIngredientCondition;
import com.app.model.UserProfileDto;
import com.app.model.WeatherConditionRequest;
import com.app.model.DishEvaluateRequest;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class IngredientAIService {
    @Value("${openai.api.key}")
    private String API_KEY;
    
    @Value("${openai.api.url}")
    private String API_URL;
    
    private final ObjectMapper mapper = new ObjectMapper();
    @Autowired
    private GoogleRecipeSearchService googleRecipeSearchService;
    public List<IngredientResponse> getTo30Ingredients(RequestIngredientCondition request) throws Exception {
        String prompt = buildPrompt(request);

        String payload = """
        {
            "model": "gpt-4",
            "messages": [
                {"role": "system", "content": "You are a culinary expert that recommends fresh ingredients based on location and current weather."},
                {"role": "user", "content": %s}
            ],
            "temperature": 0.7
        }
        """.formatted(mapper.writeValueAsString(prompt));

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(API_URL))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + API_KEY)
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        JsonNode root = mapper.readTree(response.body());
        String replyContent = root.get("choices").get(0).get("message").get("content").asText();

        return mapper.readValue(replyContent, new TypeReference<List<IngredientResponse>>() {});
    }

    private String buildPrompt(RequestIngredientCondition request) {
        WeatherConditionRequest weather = request.getWeather();
        Location location = request.getLocation();
        
        return String.format("""
                Based on current weather and location, recommend 12 fresh and suitable ingredients for cooking.
                
                Priorities:
                - Local/seasonal ingredients available in %s, %s
                - Suitable for %s weather (%.1f°C)
                - Include: vegetables, fruits, proteins, grains, spices
                - Easy to buy and store in current conditions
                - Consider local food culture and availability
                
                Weather details:
                Condition: %s, Temperature: %.1f°C, Feels like: %.1f°C
                Humidity: %d%%, Pressure: %d hPa
                Location: %s, %s (%.4f, %.4f)
                
                Return exactly 12 ingredients in JSON format:
                [
                  {"name": "Tomatoes", "reason": "Fresh, hydrating, perfect for hot weather soups"},
                  {"name": "Local fish", "reason": "Fresh protein, commonly available in coastal areas"}
                ]
                
                Respond with ingredients names and reasons in the local language if possible.
                Only return JSON array, no explanations.
                """,
                location.getCity(),
                location.getCountry(),
                weather.getMain(),
                weather.getTemperature(),
                weather.getMain(),
                weather.getTemperature(),
                weather.getFellingTemp(),
                weather.getHumidity(),
                weather.getPressure(),
                location.getCity(),
                location.getCountry(),
                location.getLat(),
                location.getLon()
        );
    }
    private String buildDishPrompt(DishFormRequest request) {
        WeatherConditionRequest weather = request.getWeather();
        List<IngredientResponse> ingredients = request.getIngredients();
        Location location = request.getLocation();
        
        String ingredientList = ingredients.stream()
                .map(IngredientResponse::getName)
                .collect(Collectors.joining(", "));

        return String.format("""
            Suggest 5 to 8 dishes from %s cuisine that are suitable for current weather and available ingredients.
            
            Requirements:
            - Traditional/popular dishes from %s
            - Suitable for %s weather (%.1f°C)
            - Use at least 1 ingredient from the provided list
            - Easy to cook at home
            - Consider local cooking methods and preferences
            
            Weather: %s, %.1f°C, humidity %d%%
            Location: %s, %s
            Available ingredients: %s
            
            Return 5 to 8 dishes and make sure that dish is really existed in JSON format:
            [
              {
                "name": "Dish name in local language",
                "reason": "Why it's suitable for the weather and uses available ingredients",
                   "cookingMethod":"grill what methond using to cooking that dish ",
                  
                
              }
            ]
            
            Note: URLs can be examples, don't need to be real existing links.
            Respond in the local language if possible.
            Only return JSON array, no explanations.
            """,
            location.getCountry(),
            location.getCountry(),
            weather.getMain(),
            weather.getTemperature(),
            weather.getMain(),
            weather.getTemperature(),
            weather.getHumidity(),
            location.getCity(),
            location.getCountry(),
            ingredientList
        );
    }
    
    public List<DishEvaluateRequest> getDishesFromAI(DishFormRequest request) throws Exception {
        String prompt = buildDishPrompt(request);

        String payload = """
            {
                "model": "gpt-4",
                "messages": [
                    {"role": "system", "content": "You are a culinary assistant that suggests dishes based on weather and available ingredients."},
                    {"role": "user", "content": %s}
                ],
                "temperature": 0.7
            }
        """.formatted(mapper.writeValueAsString(prompt));

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(API_URL))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + API_KEY)
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        JsonNode root = mapper.readTree(response.body());
        String replyContent = root.get("choices").get(0).get("message").get("content").asText();

        List<DishEvaluateRequest> dishes = mapper.readValue(replyContent, new TypeReference<>() {});
        for (int i = 0; i < dishes.size(); i++) {
            dishes.get(i).setIdx("dish" + (i + 1));
        }
        // ✅ Gắn URL thật vào từng món ăn
        for (DishEvaluateRequest dish : dishes) {
            String realUrl = googleRecipeSearchService.findRecipeUrl(dish.getName(), request.getLocation().getCountry());
            dish.setUrl(realUrl);
        }

        return dishes;
    }
    private String buildDishAdvicePrompt(List<UserProfileDto> users, List<DishEvaluateRequest> dishes) {
        String dishInfo = "";
        for (DishEvaluateRequest dish : dishes) {
            dishInfo += String.format("- ID: %s\n  Tên: %s\n  Phương pháp nấu: %s\n\n",
                    dish.getIdx(), dish.getName(), dish.getCookingMethod());
        }

        String userInfo = "";
        for (UserProfileDto user : users) {
            // Chỉ trích xuất thông tin cần thiết cho đánh giá món ăn
            userInfo += String.format("""
                - Họ tên: %s
                  Tuổi: %d, Giới tính: %s
                  BMI: %.1f (%s)
                  TDEE: %.0f cal/ngày
                  Tình trạng sức khỏe: %s
                  Dị ứng: %s
                  Nguyên liệu không thích: %s
                  Khẩu vị: %s
                
                """,
                    user.name(), user.age(), user.gender(),
                    user.bmi(), user.bmiCategory(),
                    user.tdee(),
                    user.healthCondition(),
                    user.allergies(),
                    user.dislikedIngredients(),
                    user.tastePreference());
        }

        String prompt = """
            Bạn là chuyên gia dinh dưỡng chuyên nghiệp.
            Đánh giá độ phù hợp của từng món ăn với từng thành viên dựa trên:
            - Nhu cầu calo (TDEE) và BMI
            - Tình trạng sức khỏe
            - Dị ứng và nguyên liệu không thích
            - Khẩu vị cá nhân

            === DANH SÁCH MÓN ĂN ===
            """ + dishInfo + """

            === HỒ SƠ THÀNH VIÊN ===
            """ + userInfo + """

            === YÊU CẦU ===
            Đối với mỗi món ăn, hãy trả về:
            - familySuitabilityLevel: HIGH, MEDIUM hoặc LOW
            - suggestionNote: Gợi ý điều chỉnh (nếu cần)
            - userSuitability: đánh giá từng thành viên

            === FORMAT JSON ===
            [
              {
                "idx": "id_món",
                "familySuitabilityLevel": "HIGH",
                "suggestionNote": "Giảm muối cho người cao huyết áp",
                "userSuitability": [
                  {
                    "userName": "Tên",
                    "suitability": "Hợp/Không hợp/Cần cân nhắc",
                    "score": 8,
                    "shortNote": "Phù hợp TDEE, không dị ứng"
                  }
                ]
              }
            ]

            CHỈ TRẢ VỀ JSON, KHÔNG GIẢI THÍCH.
            """;

        return prompt;
    }

    public List<EvaluateResult> evaluateDishDetailed(List<UserProfileDto> users, List<DishEvaluateRequest> dishes) throws Exception {
    	
        String prompt = buildDishAdvicePrompt(users, dishes);
        
        // Increase token limit for detailed response
        String payload = """
        {
            "model": "gpt-4",
            "messages": [
                {
                    "role": "system",
                    "content": "Bạn là chuyên gia dinh dưỡng và đầu bếp chuyên nghiệp với 20 năm kinh nghiệm. Bạn hiểu rõ ẩm thực Việt Nam và nhu cầu dinh dưỡng của từng độ tuổi, giới tính. Hãy đưa ra đánh giá chi tiết, khoa học nhưng dễ hiểu."
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
            .uri(URI.create(API_URL))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + API_KEY)
            .POST(HttpRequest.BodyPublishers.ofString(payload))
            .build();
        
        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());
        
        // Enhanced error handling
        if (response.statusCode() != 200) {
            throw new RuntimeException("API call failed with status: " + response.statusCode());
        }
        
        JsonNode root = mapper.readTree(response.body());
        String replyContent = root.get("choices").get(0).get("message").get("content").asText();
        
        try {
            return mapper.readValue(replyContent, new TypeReference<List<EvaluateResult>>() {});
        } catch (Exception e) {
            // Log the raw response for debugging
            System.err.println("Failed to parse response: " + replyContent);
            throw new RuntimeException("Failed to parse AI response", e);
        }
    }
    private String buildDishRecommendationPrompt(DishUserRequest request) {
        UserProfileDto user = request.user();
        WeatherConditionRequest weather = request.weather();
        Location location = request.location();

        String userInfo = String.format("""
            === THÔNG TIN CÁ NHÂN ===
            - Họ tên: %s
            - Tuổi: %d, Giới tính: %s
            - BMI: %.1f (%s), Cân nặng: %.1f kg, Cân nặng mục tiêu: %.1f kg
            - BMR: %.0f cal/ngày, TDEE: %.0f cal/ngày
            - Tình trạng sức khỏe: %s
            - Dị ứng: %s
            - Nguyên liệu tránh: %s
            - Khẩu vị: %s
            - Bữa ăn: %s
            - Lời khuyên dinh dưỡng: %s
            """,
            user.name(), user.age(), user.gender(),
            user.bmi(), user.bmiCategory(), user.weightKg(), user.targetWeight(),
            user.bmr(), user.tdee(),
            user.healthCondition(),
            user.allergies(),
            user.dislikedIngredients(),
            user.tastePreference(),
            request.mealType(),
            user.dietAdvice());

        String weatherLocationInfo = String.format("""
            === ĐIỀU KIỆN THỜI TIẾT & ĐỊA LÝ ===
            - Thời tiết: %s
            - Nhiệt độ: %.1f°C (cảm nhận: %.1f°C)
            - Độ ẩm: %d%%, Áp suất: %d hPa
            - Địa điểm: %s, %s
            """,
            weather.getMain(), weather.getTemperature(), weather.getFellingTemp(),
            weather.getHumidity(), weather.getPressure(),
            location.getCity(), location.getCountry());

        String prompt = String.format("""
            Bạn là chuyên gia dinh dưỡng và đầu bếp chuyên nghiệp với 20 năm kinh nghiệm về ẩm thực Việt Nam và quốc tế.

            %s

            %s

            === YÊU CẦU GỢI Ý MÓN ĂN ===
            Hãy gợi ý %d món ăn phù hợp nhất dựa trên:

            1. Phù hợp nhu cầu dinh dưỡng: TDEE, BMI, mục tiêu cân nặng
            2. An toàn sức khỏe: Tránh dị ứng, phù hợp bệnh nền, tuổi tác
            3. Phù hợp thời tiết: Món nóng/lạnh, thanh mát/bổ dưỡng theo nhiệt độ
            4. Đặc sản địa phương: Món ăn phổ biến tại vị trí hiện tại
            5. Khẩu vị cá nhân: Tránh nguyên liệu không thích, đúng sở thích

            === FORMAT JSON ===
            [
              {
                "dishName": "Phở bò tái",
               
                "description": "Món nước truyền thống Việt Nam với thịt bò và nước dùng thơm ngon.",
                "mainIngredients": ["bánh phở", "thịt bò", "hành", "rau thơm"],
                "calories": 450,
              
                "healthSuitability": "Không chứa nguyên liệu gây dị ứng, phù hợp người cao huyết áp nếu giảm muối",
                "goalAlignment": "Phù hợp người đang muốn duy trì cân nặng và bổ sung năng lượng lành mạnh",
                "tasteMatch": "Đậm đà, phù hợp khẩu vị miền Bắc, không chứa nguyên liệu không thích",
                "overallScore": 9,
                "recommendationNote": "Thích hợp với thời tiết mát, dễ tiêu hóa, ngon và phổ biến"
              }
            ]

            === LƯU Ý ===
            - Mỗi món ăn phải có tên rõ ràng (VD: "Phở bò", "Canh chua cá lóc")
            - `mainIngredients` là danh sách nguyên liệu chính (tối đa 5)
            - `url` là link ảnh minh hoạ món ăn nếu có (hoặc để trống)
            - `overallScore` phản ánh tổng thể từ 1–10 (10 là hoàn hảo)
            - Ưu tiên món ăn Việt Nam, đặc sản địa phương
            - Trả JSON đúng cấu trúc như trên, không giải thích, không văn bản ngoài

            CHỈ TRẢ VỀ JSON.
            """,
            userInfo,
            weatherLocationInfo,
            request.numberOfDishes());

        return prompt;
    }

public List<DishRecommendationDto> findDishForOneUser(DishUserRequest dishU) throws Exception {
    	
        String prompt = buildDishRecommendationPrompt(dishU);
        
        // Increase token limit for detailed response
        String payload = """
        {
            "model": "gpt-4",
            "messages": [
                {
                    "role": "system",
                    "content": "Bạn là chuyên gia dinh dưỡng và đầu bếp chuyên nghiệp với 20 năm kinh nghiệm. Bạn hiểu rõ ẩm thực Việt Nam và nhu cầu dinh dưỡng của từng độ tuổi, giới tính. Hãy đưa ra đánh giá chi tiết, khoa học nhưng dễ hiểu."
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
            .uri(URI.create(API_URL))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + API_KEY)
            .POST(HttpRequest.BodyPublishers.ofString(payload))
            .build();
        
        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());
        
        // Enhanced error handling
        if (response.statusCode() != 200) {
            throw new RuntimeException("API call failed with status: " + response.statusCode());
        }
        
        JsonNode root = mapper.readTree(response.body());
        String replyContent = root.get("choices").get(0).get("message").get("content").asText();
        
        try {
            return mapper.readValue(replyContent, new TypeReference<List<DishRecommendationDto>>() {});
        } catch (Exception e) {
            // Log the raw response for debugging
            System.err.println("Failed to parse response: " + replyContent);
            throw new RuntimeException("Failed to parse AI response", e);
        }
    }


}