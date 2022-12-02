import { createSelasClient } from "../src/index";

describe("testing index file", () => {

    test("creation of user ", async () => {
        const selas = await createSelasClient({
            app_id: "55d5030b-bb9b-4065-9659-cfde4ecbb4a9",
            key: "@8Obb--r%VyOHfR-",
            secret: "xBfuyKuTrtvK73y1"
        });

        const result_user = await selas.createAppUser();

        const v_app_user_id = String(result_user.data);

        const result_token = await selas.createToken({ app_user_id: v_app_user_id });

        const v_app_user_token = String(result_token.data);

        const credit_result_1 = await selas.getAppUserCredits({ app_user_id: v_app_user_id });

        expect(credit_result_1.data).toBe(0);

        await selas.addCredit({ app_user_id: v_app_user_id, amount: 10 });

        const credit_result_2 = await selas.getAppUserCredits({ app_user_id: v_app_user_id });

        expect(credit_result_2.data).toBe(10);

        await selas.postJob({
            app_user_id: v_app_user_id,
            app_user_token: v_app_user_token,
            service_id: '04cdf9c4-5338-4e32-9e63-e15b2150d7f9',
            job_config: '{"steps":100,"width":512,"height":512,"prompt":"cute cat","sampler":"k_lms","translate":false,"batch_size":1,"skip_steps":12,"nsfw_filter":false,"image_format":"png","guidance_scale":7.5}',
            worker_filter: '{"name":"^a.*","branch":"dev"}'
        });

        const result_deactivation = await selas.deactivateAppUser({ app_user_id: v_app_user_id });

        expect(result_deactivation.data).toBe(true);

    });
});