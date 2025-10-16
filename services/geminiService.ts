import { GoogleGenAI, Modality } from "@google/genai";
import { AppMode, ImageFile, Language, AIResponse, Concept } from '../types';

if (!process.env.API_KEY) {
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

const getRecreateVisualPrompt = (lang: Language) => {
  if (lang === Language.VI) {
    return `Bạn là một huấn luyện viên tạo dáng trực quan chuyên nghiệp. Nhiệm vụ của bạn là phân tích hai hình ảnh: hình đầu tiên là 'Dáng Mẫu', hình thứ hai là 'Người Mẫu'. Mục tiêu là giúp người trong ảnh 'Người Mẫu' sao chép lại 'Dáng Mẫu'.
Phản hồi của bạn PHẢI chứa hai phần:
1.  **Một phiên bản đã chỉnh sửa của ảnh 'Người Mẫu'.** Trên ảnh này, hãy vẽ các lớp phủ bán trong suốt, đường kẻ và mũi tên để hướng dẫn rõ ràng các điều chỉnh tư thế.
2.  **Một hướng dẫn văn bản ngắn gọn, từng bước** giải thích các điều chỉnh được hiển thị trong hình ảnh. Tập trung vào những thay đổi chính về góc độ cơ thể, tay chân và độ nghiêng đầu.
Hãy đảm bảo phần văn bản mang tính khích lệ và dễ làm theo. Phản hồi bằng tiếng Việt.`;
  }
  return `You are an expert visual posing coach. Your task is to analyze two images: the first is the 'Target Pose', and the second is the 'Model'. Your goal is to help the person in the 'Model' image replicate the 'Target Pose'.
Your response MUST contain two parts:
1.  **An edited version of the 'Model' image.** On this image, draw semi-transparent overlays, lines, and arrows to clearly guide the user's pose adjustments.
2.  **A concise, step-by-step text guide** explaining the adjustments shown in the image. Focus on key changes in body angle, limbs, and head tilt.
Ensure the text is encouraging and easy to follow. Respond in English.`;
};

const getImproveConceptsPrompt = (lang: Language) => {
    const separator = '||CONCEPT_BREAK||';
    if (lang === Language.VI) {
        return `Bạn là một giám đốc sáng tạo cho một buổi chụp ảnh. Hãy phân tích khung cảnh được cung cấp. Đề xuất 3 concept sáng tạo và khác biệt để một người có thể tạo dáng trong khung cảnh này.
Đối với mỗi concept, hãy cung cấp một tiêu đề ngắn, hấp dẫn và một đoạn mô tả.
**Cấu trúc phản hồi văn bản của bạn bằng cách bắt đầu mỗi concept với dấu phân cách '${separator}'**. Dòng đầu tiên sau dấu phân cách phải là tiêu đề.
Sau khi cung cấp văn bản cho cả 3 concept, **hãy tạo 3 hình ảnh minh họa chất lượng cao tương ứng**, mỗi hình một concept, theo đúng thứ tự. Phản hồi bằng tiếng Việt.`;
    }
    return `You are a creative director for a photoshoot. Analyze the provided scene. Propose 3 distinct and creative concepts for a person to pose in this scene.
For each concept, provide a short, catchy title and a descriptive paragraph.
**Structure your text response by starting each concept with the separator '${separator}'**. The first line after the separator should be the title.
After providing the text for all 3 concepts, **generate 3 corresponding high-quality illustrative images**, one for each concept, in the same order. Respond in English.`;
};


interface GenerateParams {
  mode: AppMode;
  language: Language;
  images: ImageFile[];
}

const generateRecreateAdvice = async ({ language, images }: Omit<GenerateParams, 'mode'>): Promise<AIResponse> => {
    const prompt = getRecreateVisualPrompt(language);
    const imageParts = images.map(image => ({
        inlineData: {
            mimeType: image.mimeType,
            data: image.base64,
        },
    }));

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }, ...imageParts] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    let textResponse = '';
    let imageResponse: string | null = null;
    const candidate = response.candidates?.[0];

    if (candidate?.content?.parts && candidate.content.parts.length > 0) {
        for (const part of candidate.content.parts) {
            if (part.text) {
                textResponse += part.text;
            } else if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const mimeType = part.inlineData.mimeType;
                imageResponse = `data:${mimeType};base64,${base64ImageBytes}`;
            }
        }
    } else {
        throw new Error('Model did not return any content. The request may have been blocked due to safety policies.');
    }
    
    return { text: textResponse, image: imageResponse };
};

const generateImproveConcepts = async ({ language, images }: Omit<GenerateParams, 'mode'>): Promise<Concept[]> => {
    const prompt = getImproveConceptsPrompt(language);
    const imagePart = {
        inlineData: {
            mimeType: images[0].mimeType,
            data: images[0].base64,
        },
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }, imagePart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    let textContent = '';
    const imageContents: string[] = [];
    const candidate = response.candidates?.[0];

    if (candidate?.content?.parts && candidate.content.parts.length > 0) {
        for (const part of candidate.content.parts) {
            if (part.text) {
                textContent += part.text;
            } else if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const mimeType = part.inlineData.mimeType;
                imageContents.push(`data:${mimeType};base64,${base64ImageBytes}`);
            }
        }
    }

    if (!textContent || imageContents.length === 0) {
        throw new Error('Model did not return enough content. The request may have been blocked due to safety policies.');
    }

    const concepts: Concept[] = [];
    const textParts = textContent.split('||CONCEPT_BREAK||').filter(p => p.trim() !== '');
    
    const numConcepts = Math.min(textParts.length, imageContents.length);

    for (let i = 0; i < numConcepts; i++) {
        const textPart = textParts[i].trim();
        const lines = textPart.split('\n');
        const name = lines[0].trim();
        const description = lines.slice(1).join('\n').trim();
        
        concepts.push({
            name,
            description,
            image: imageContents[i]
        });
    }

    return concepts;
};


export const generatePosingAdvice = async ({ mode, language, images }: GenerateParams): Promise<AIResponse | Concept[]> => {
  try {
    if (mode === AppMode.RECREATE) {
      return await generateRecreateAdvice({ language, images });
    } else { // AppMode.IMPROVE
      return await generateImproveConcepts({ language, images });
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error('An unknown error occurred while calling the Gemini API.');
  }
};
