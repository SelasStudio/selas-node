import { createSelasClient } from "../src/index";

describe("testing index file", () => {

    test("creation of user ", async () => {
        const selas = await createSelasClient({
            app_id: "55d5030b-bb9b-4065-9659-cfde4ecbb4a9",
            key: "@8Obb--r%VyOHfR-",
            secret: "xBfuyKuTrtvK73y1"
        });

        const { data, error } = await selas.createAppUser();
        console.log(data);
        console.log(error);
    });

    test("create_token", async () => {
        const selas = await createSelasClient({
            app_id: "55d5030b-bb9b-4065-9659-cfde4ecbb4a9",
            key: "@8Obb--r%VyOHfR-",
            secret: "xBfuyKuTrtvK73y1"
        });

        console.log(await selas.createToken({ app_user_id: "7ef2bbbd-c5c4-4ad5-8e6e-129a9a58c2b4" }));
    });

    test("post_job", async () => {
        const selas = await createSelasClient({
            app_id: "55d5030b-bb9b-4065-9659-cfde4ecbb4a9",
            key: "@8Obb--r%VyOHfR-",
            secret: "xBfuyKuTrtvK73y1"
        });

        console.log(await selas.postJob({
            app_user_id: 'c34b730f-3a1f-430d-ba62-4f6c76b4125f',
            app_user_token: 'BAE6AYDr4pto=6y7',
            service_id: '04cdf9c4-5338-4e32-9e63-e15b2150d7f9',
            job_config: '{"steps":100,"width":512,"height":512,"prompt":"cute cat","sampler":"k_lms","translate":false,"batch_size":1,"skip_steps":12,"nsfw_filter":false,"image_format":"png","guidance_scale":7.5}',
            worker_filter: '{"name":"^a.*","branch":"dev"}'
        }));
    });


    test("delete_token", async () => {
        const selas = await createSelasClient({
            app_id: "55d5030b-bb9b-4065-9659-cfde4ecbb4a9",
            key: "@8Obb--r%VyOHfR-",
            secret: "xBfuyKuTrtvK73y1"
        });

        console.log(await selas.deactivateAppUser({ app_user_id: "7ef2bbbd-c5c4-4ad5-8e6e-129a9a58c2b4" }));
    });

    test("add credit", async () => {
        const selas = await createSelasClient({
            app_id: "55d5030b-bb9b-4065-9659-cfde4ecbb4a9",
            key: "@8Obb--r%VyOHfR-",
            secret: "xBfuyKuTrtvK73y1"
        });

        const { data, error } = await selas.addCredit({ app_user_id: "a7909a31-2a3e-4e13-9cd1-0fa745a4755d", amount: 3 });
        console.log(data);
        console.log(error);
    });

    test("get credit", async () => {
        const selas = await createSelasClient({
            app_id: "55d5030b-bb9b-4065-9659-cfde4ecbb4a9",
            key: "@8Obb--r%VyOHfR-",
            secret: "xBfuyKuTrtvK73y1"
        });

        const { data, error } = await selas.getAppUserCredits({ app_user_id: "a7909a31-2a3e-4e13-9cd1-0fa745a4755d" });
        console.log(data);
        console.log(error);
    });




});